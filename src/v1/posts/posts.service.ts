import { Injectable, NotFoundException, HttpException } from "@nestjs/common";
import { post_comments } from "../../../generated/prisma";
import { PrismaService } from "../../db/prisma.service";
import { PostsRepository } from "./posts.repository";
import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { LikePostDto } from "./dto/like-post.dto";
import { MinioService } from "../../common/s3/minio.service";

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private postsRepository: PostsRepository,
    private minioService: MinioService
  ) {}

  private truncateBody(body?: string, maxLength: number = 200): string {
    if (!body) return "";
    return body.length > maxLength
      ? body.substring(0, maxLength) + "..."
      : body;
  }

  async posts(params: { offset?: number; limit?: number }) {
    const { offset = 0, limit = 10 } = params;
    const postsData = await this.postsRepository.findAll({
      where: {
        deleted_at: null,
        published: true,
      },
      offset,
      take: limit,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
            post_likes: true,
            image: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const totalposts = await this.prisma.posts.count({
      where: {
        deleted_at: null,
        published: true,
      },
    });

    const totalPages = Math.ceil(totalposts / limit);

    return {
      postsData: postsData.map((post) => ({
        ...post,
        body: this.truncateBody(post.body ?? ""),
        tags: post.tags.map((tagRelation) => tagRelation.tag),
      })),
      metadata: {
        total_items: totalposts,
        offset: offset,
        limit: limit,
        total_pages: totalPages,
      },
    };
  }

  async getPostsByCreator(user_id: string, offset = 0, limit = 10) {
    const posts = await this.postsRepository.getPostsByCreator(
      user_id,
      offset,
      limit
    );
    // truncate body
    const postsData = posts.map((post) => ({
      ...post,
      body: this.truncateBody(post.body ?? ""),
      tags: post.tags.map((tagRelation) => tagRelation.tag),
    }));
    // count total items
    const totalItems =
      await this.postsRepository.getPostsByCreatorCount(user_id);
    const totalPages = Math.ceil(totalItems / limit);

    const metadata = {
      total_items: totalItems,
      offset: offset,
      limit: limit,
      total_pages: totalPages,
    };
    return { postsData, metadata };
  }

  findById(id: string) {
    return this.prisma.posts.findUnique({ where: { id: id } });
  }

  async getPostRandom(limit: number = 6) {
    const postsData = await this.postsRepository.findPostRandom(limit);
    return postsData.map((post) => ({
      ...post,
      body: this.truncateBody(post.body ?? ""),
    }));
  }

  createComment(data: any) {
    return this.prisma.post_comments.create({ data });
  }

  getAllComments(postId: string): Promise<post_comments[]> {
    return this.prisma.post_comments.findMany({
      where: { post_id: postId, parrent_comment_id: null },
      orderBy: { created_at: "asc" },
      include: { creator: true },
    });
  }

  getByUsernameAndSlug(username: string, slug: string) {
    return this.postsRepository.findByUsernameAndSlug(username, slug);
  }

  async deletePost(post_id: string) {
    const post = await this.prisma.posts.findUnique({ where: { id: post_id } });
    if (!post) {
      throw new HttpException("Post not found", 404);
    }
    return this.prisma.posts.delete({ where: { id: post_id } });
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async createPost(
    postData: CreatePostDto,
    user_id: string,
    file?: Express.Multer.File
  ) {
    let photo_url: string | undefined;
    const slug = postData.slug || this.generateSlug(postData.title);

    const existingPost = await this.prisma.posts.findFirst({
      where: {
        slug,
      },
    });

    if (existingPost) {
      throw new HttpException("Post with this slug already exists", 400);
    }

    if (file) {
      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.originalname.split(".").pop();
      const objectName = `public/posts/${user_id}/${timestamp}.${extension}`;

      // Upload to Minio/S3
      photo_url = await this.minioService.uploadFile(objectName, file);
    }

    const newpost = await this.prisma.posts.create({
      data: {
        created_by: user_id,
        created_at: new Date(),
        title: postData.title,
        body: postData.body,
        slug,
        photo_url,
        published: true,
      },
    });

    // Handle tags if provided
    if (postData.tags && postData.tags.length > 0) {
      for (const tagName of postData.tags) {
        // Find or create tag
        const tag = await this.prisma.tags.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });

        // Create relation
        await this.prisma.posts_to_tags.create({
          data: {
            post_id: newpost.id,
            tag_id: tag.id,
          },
        });
      }
    }

    return newpost;
  }

  async updatePost(updateData: UpdatePostDto, user_id: string) {
    const { id, title, body, slug } = updateData;

    const post = await this.prisma.posts.upsert({
      where: { id },
      update: {
        title,
        body,
        ...(slug && { slug }),
      },
      create: {
        id,
        title,
        body,
        slug: slug || this.generateSlug(title),
        created_by: user_id,
        published: true,
      },
    });

    return post;
  }
  async updatePublishPost(post_id: string, published: boolean = true) {
    const post = await this.prisma.posts.findUnique({
      where: { id: post_id },
    });
    if (!post) {
      throw new NotFoundException("Post not found");
    }
    const updatedPost = await this.prisma.posts.update({
      where: { id: post_id },
      data: { published },
    });
    return updatedPost;
  }

  async likePost(likePostDto: LikePostDto, user_id: string) {
    const { post_id } = likePostDto;

    // Check if post exists
    const post = await this.prisma.posts.findUnique({
      where: { id: post_id },
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    // Check if user already liked the post
    const existingLike = await this.prisma.likes.findFirst({
      where: {
        post_id,
        user_id,
      },
    });

    if (existingLike) {
      // User already liked the post, so we'll return the existing like
      return existingLike;
    }

    // Create a new like
    const like = await this.prisma.likes.create({
      data: {
        post_id,
        user_id,
        created_at: new Date(),
      },
    });

    return like;
  }

  async unlikePost(post_id: string, user_id: string) {
    // Check if post exists
    const post = await this.prisma.posts.findUnique({
      where: { id: post_id },
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    // Find the like
    const existingLike = await this.prisma.likes.findFirst({
      where: {
        post_id,
        user_id,
      },
    });

    if (!existingLike) {
      throw new NotFoundException("Like not found");
    }

    // Delete the like
    await this.prisma.likes.delete({
      where: { id: existingLike.id },
    });

    return { success: true, message: "Post unliked successfully" };
  }

  async getPostLikes(post_id: string) {
    // Check if post exists
    const post = await this.prisma.posts.findUnique({
      where: { id: post_id },
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    // Get likes count
    const likesCount = await this.prisma.likes.count({
      where: { post_id },
    });

    // Get users who liked the post
    const likes = await this.prisma.likes.findMany({
      where: { post_id },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            first_name: true,
            last_name: true,
            image: true,
          },
        },
      },
    });

    return {
      count: likesCount,
      users: likes.map((like) => like.users),
    };
  }

  async checkUserLiked(post_id: string, user_id: string) {
    const like = await this.prisma.likes.findFirst({
      where: {
        post_id,
        user_id,
      },
    });

    return { liked: !!like };
  }
}
