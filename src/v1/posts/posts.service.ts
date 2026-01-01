import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { post_comments } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma.service";
import { PostsRepository } from "./posts.repository";
import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { LikePostDto } from "./dto/like-post.dto";
import { BookmarkPostDto } from "./dto/bookmark-post.dto";
import { RecordViewDto } from "./dto/record-view.dto";
import { MinioService } from "../../common/s3/minio.service";
import {
  AdminCreatePostDto,
  AdminUpdatePostDto,
  AdminBulkOperationDto,
  AdminPostQueryDto,
} from "./dto/admin-posts.dto";

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

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

  async findAllPosts(params: { offset?: number; limit?: number }) {
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
    const totalItems = await this.postsRepository.getPostsByCreatorCount(
      user_id
    );
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
      include: {
        creator: {
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
  }

  getByUsernameAndSlug(username: string, slug: string) {
    return this.postsRepository.findByUsernameAndSlug(username, slug);
  }

  async deletePost(post_id: string) {
    const post = await this.prisma.posts.findUnique({ where: { id: post_id } });
    if (!post) {
      throw new NotFoundException("Post not found");
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
      throw new BadRequestException("Post with this slug already exists");
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

    const existingPost = await this.prisma.posts.findUnique({ where: { id } });
    if (!existingPost) {
      throw new NotFoundException("Post not found");
    }

    const post = await this.prisma.posts.update({
      where: { id },
      data: {
        title,
        body,
        ...(slug && { slug }),
      },
    });

    return post;
  }
  async patchPost(
    post_id: string,
    updateData: {
      published?: boolean;
      title?: string;
      body?: string;
      slug?: string;
    },
    user_id?: string
  ) {
    const post = await this.prisma.posts.findUnique({
      where: { id: post_id },
    });
    if (!post) {
      throw new NotFoundException("Post not found");
    }
    if (user_id && post.created_by !== user_id) {
      throw new ForbiddenException("You can only update your own posts");
    }

    // Check slug uniqueness if changed
    if (updateData.slug && updateData.slug !== post.slug) {
      const existingSlug = await this.prisma.posts.findFirst({
        where: { slug: updateData.slug, NOT: { id: post_id } },
      });
      if (existingSlug) {
        throw new BadRequestException("Post with this slug already exists");
      }
    }

    const updatedPost = await this.prisma.posts.update({
      where: { id: post_id },
      data: {
        ...(updateData.published !== undefined && { published: updateData.published }),
        ...(updateData.title && { title: updateData.title }),
        ...(updateData.body && { body: updateData.body }),
        ...(updateData.slug && { slug: updateData.slug }),
        updated_at: new Date(),
      },
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
      throw new BadRequestException("User has already liked this post");
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

  async bookmarkPost(bookmarkPostDto: BookmarkPostDto, user_id: string) {
    const { post_id } = bookmarkPostDto;

    // Check if post exists
    const post = await this.prisma.posts.findUnique({
      where: { id: post_id },
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    // Check if user already bookmarked the post
    const existingBookmark = await this.postsRepository.findBookmark(
      post_id,
      user_id
    );

    if (existingBookmark) {
      throw new BadRequestException("User has already bookmarked this post");
    }

    // Create a new bookmark
    const bookmark = await this.postsRepository.bookmarkPost(post_id, user_id);

    return bookmark;
  }

  async unbookmarkPost(post_id: string, user_id: string) {
    // Check if post exists
    const post = await this.prisma.posts.findUnique({
      where: { id: post_id },
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    // Find the bookmark
    const existingBookmark = await this.postsRepository.findBookmark(
      post_id,
      user_id
    );

    if (!existingBookmark) {
      throw new NotFoundException("Bookmark not found");
    }

    // Delete the bookmark
    await this.postsRepository.unbookmarkPost(post_id, user_id);

    return { success: true, message: "Post unbookmarked successfully" };
  }

  async getPostBookmarks(post_id: string) {
    // Check if post exists
    const post = await this.prisma.posts.findUnique({
      where: { id: post_id },
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    // Get bookmarks count
    const bookmarksCount = await this.postsRepository.getPostBookmarksCount(
      post_id
    );

    // Get users who bookmarked the post
    const bookmarks = await this.postsRepository.getPostBookmarks(post_id);

    return {
      count: bookmarksCount,
      users: bookmarks.map((bookmark) => bookmark.users),
    };
  }

  async checkUserBookmarked(post_id: string, user_id: string) {
    const bookmark = await this.postsRepository.findBookmark(post_id, user_id);

    return { bookmarked: !!bookmark };
  }

  async getUserBookmarks(user_id: string, offset = 0, limit = 10) {
    const bookmarks = await this.postsRepository.getUserBookmarks(
      user_id,
      offset,
      limit
    );

    // Transform the data to match the expected format
    const postsData = bookmarks.map((bookmark) => ({
      ...bookmark.posts,
      body: this.truncateBody(bookmark.posts.body ?? ""),
      tags: bookmark.posts.tags.map((tagRelation) => tagRelation.tag),
      bookmarked_at: bookmark.created_at,
    }));

    // Count total items
    const totalItems = await this.postsRepository.getUserBookmarksCount(
      user_id
    );
    const totalPages = Math.ceil(totalItems / limit);

    const metadata = {
      total_items: totalItems,
      offset: offset,
      limit: limit,
      total_pages: totalPages,
    };

    return { postsData, metadata };
  }

  // Admin-specific methods
  async getAdminPosts(query: AdminPostQueryDto) {
    const {
      offset = 0,
      limit = 10,
      search,
      published = "all",
      sort_by = "created_at",
      sort_order = "desc",
      creator_id,
      tags,
    } = query;

    // Build where clause
    const where: any = {
      deleted_at: null,
    };

    // Handle published filter
    if (published !== "all") {
      where.published = published === "true";
    }

    // Handle search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
      ];
    }

    // Handle creator filter
    if (creator_id) {
      where.created_by = creator_id;
    }

    // Handle tags filter
    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: {
              in: tags,
            },
          },
        },
      };
    }

    // Build order by
    const orderBy: any = {};
    orderBy[sort_by] = sort_order;

    const [posts, total] = await Promise.all([
      this.postsRepository.findAll({
        where,
        offset,
        take: limit,
        orderBy,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
              first_name: true,
              last_name: true,
              image: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              post_likes: true,
              post_comments: true,
            },
          },
        },
      }),
      this.prisma.posts.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      posts: posts.map((post) => ({
        ...post,
        body: this.truncateBody(post.body ?? ""),
        tags: post.tags.map((tagRelation) => tagRelation.tag),
        stats: {
          likes: post.like_count,
          comments: post.view_count,
        },
      })),
      metadata: {
        total_items: total,
        offset,
        limit,
        total_pages: totalPages,
      },
    };
  }

  async adminCreatePost(
    postData: AdminCreatePostDto,
    file?: Express.Multer.File
  ) {
    let photo_url: string | undefined;
    const slug = postData.slug || this.generateSlug(postData.title);

    // Check if slug already exists
    const existingPost = await this.prisma.posts.findFirst({
      where: { slug },
    });

    if (existingPost) {
      throw new BadRequestException("Post with this slug already exists");
    }

    // Handle file upload
    if (file) {
      const timestamp = Date.now();
      const extension = file.originalname.split(".").pop();
      const userId = postData.created_by || "admin";
      const objectName = `public/posts/${userId}/${timestamp}.${extension}`;
      photo_url = await this.minioService.uploadFile(objectName, file);
    }

    // Create post
    const newPost = await this.prisma.posts.create({
      data: {
        created_by: postData.created_by || "admin",
        created_at: new Date(),
        title: postData.title,
        body: postData.body,
        slug,
        photo_url,
        published: postData.published,
      },
    });

    // Handle tags
    if (postData.tags && postData.tags.length > 0) {
      for (const tagName of postData.tags) {
        const tag = await this.prisma.tags.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });

        await this.prisma.posts_to_tags.create({
          data: {
            post_id: newPost.id,
            tag_id: tag.id,
          },
        });
      }
    }

    this.logger.log(`Admin created post: ${newPost.id}`);
    return newPost;
  }

  async adminUpdatePost(
    postData: AdminUpdatePostDto,
    file?: Express.Multer.File
  ) {
    const { id, title, body, slug, published, tags } = postData;

    // Check if post exists
    const existingPost = await this.prisma.posts.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    });

    if (!existingPost) {
      throw new NotFoundException("Post not found");
    }

    // Handle slug uniqueness if changed
    if (slug && slug !== existingPost.slug) {
      const existingSlug = await this.prisma.posts.findFirst({
        where: { slug, NOT: { id } },
      });
      if (existingSlug) {
        throw new BadRequestException("Post with this slug already exists");
      }
    }

    // Handle file upload
    let photo_url = existingPost.photo_url;
    if (file) {
      const timestamp = Date.now();
      const extension = file.originalname.split(".").pop();
      const objectName = `public/posts/${existingPost.created_by}/${timestamp}.${extension}`;
      photo_url = await this.minioService.uploadFile(objectName, file);
    }

    // Update post
    const updatedPost = await this.prisma.posts.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(body && { body }),
        ...(slug && { slug }),
        ...(published !== undefined && { published }),
        ...(file && { photo_url }),
        updated_at: new Date(),
      },
    });

    // Handle tags update
    if (tags) {
      // Remove existing tags
      await this.prisma.posts_to_tags.deleteMany({
        where: { post_id: id },
      });

      // Add new tags
      if (tags.length > 0) {
        for (const tagName of tags) {
          const tag = await this.prisma.tags.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName },
          });

          await this.prisma.posts_to_tags.create({
            data: {
              post_id: id,
              tag_id: tag.id,
            },
          });
        }
      }
    }

    this.logger.log(`Admin updated post: ${id}`);
    return updatedPost;
  }

  async adminBulkOperation(operationData: AdminBulkOperationDto) {
    const { post_ids, operation } = operationData;
    const results: Array<{
      id: string;
      success: boolean;
      error?: string;
      data?: any;
    }> = [];

    for (const postId of post_ids) {
      try {
        const post = await this.prisma.posts.findUnique({
          where: { id: postId },
        });

        if (!post) {
          results.push({
            id: postId,
            success: false,
            error: "Post not found",
          });
          continue;
        }

        let result;
        switch (operation) {
          case "publish":
            result = await this.prisma.posts.update({
              where: { id: postId },
              data: { published: true, updated_at: new Date() },
            });
            break;
          case "unpublish":
            result = await this.prisma.posts.update({
              where: { id: postId },
              data: { published: false, updated_at: new Date() },
            });
            break;
          case "delete":
            result = await this.prisma.posts.delete({
              where: { id: postId },
            });
            break;
        }

        results.push({
          id: postId,
          success: true,
          data: result,
        });

        this.logger.log(`Admin ${operation} post: ${postId}`);
      } catch (error) {
        results.push({
          id: postId,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      total: post_ids.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  async getAdminPostStats() {
    const [
      totalPosts,
      publishedPosts,
      unpublishedPosts,
      totalDeleted,
      postsThisMonth,
      postsLastMonth,
    ] = await Promise.all([
      this.prisma.posts.count(),
      this.prisma.posts.count({ where: { published: true } }),
      this.prisma.posts.count({ where: { published: false } }),
      this.prisma.posts.count({ where: { NOT: { deleted_at: null } } }),
      this.prisma.posts.count({
        where: {
          created_at: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.prisma.posts.count({
        where: {
          created_at: {
            gte: new Date(
              new Date().getFullYear(),
              new Date().getMonth() - 1,
              1
            ),
            lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      total: totalPosts,
      published: publishedPosts,
      unpublished: unpublishedPosts,
      deleted: totalDeleted,
      thisMonth: postsThisMonth,
      lastMonth: postsLastMonth,
      growth:
        postsLastMonth > 0
          ? (
              ((postsThisMonth - postsLastMonth) / postsLastMonth) *
              100
            ).toFixed(2)
          : "0",
    };
  }

  async recordView(
    recordViewDto: RecordViewDto,
    user_id?: string
  ) {
    const { post_id, ip_address, user_agent } = recordViewDto;

    // Check if post exists
    const post = await this.prisma.posts.findUnique({
      where: { id: post_id },
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    // Record the view
    const view = await this.prisma.post_views.create({
      data: {
        post_id,
        user_id,
        ip_address,
        user_agent,
        created_at: new Date(),
      },
    });

    // Increment the view count
    await this.prisma.posts.update({
      where: { id: post_id },
      data: {
        view_count: {
          increment: 1,
        },
      },
    });

    return view;
  }

  async getPostViews(post_id: string) {
    // Check if post exists
    const post = await this.prisma.posts.findUnique({
      where: { id: post_id },
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    // Get views count
    const viewsCount = await this.prisma.post_views.count({
      where: {
        post_id,
        deleted_at: null,
      },
    });

    // Get users who viewed the post
    const views = await this.prisma.post_views.findMany({
      where: {
        post_id,
        deleted_at: null,
      },
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
      orderBy: {
        created_at: "desc",
      },
    });

    return {
      count: viewsCount,
      users: views.map((view) => view.users),
    };
  }
}
