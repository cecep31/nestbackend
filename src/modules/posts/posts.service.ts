import { Injectable, NotFoundException } from '@nestjs/common';
import { post_comments } from '../../../generated/prisma';
import { PrismaService } from '../../db/prisma.service';
import { PostsRepository } from './posts.repository';
import { CreatePostDto } from './dto/create-post.dto';
import { LikePostDto } from './dto/like-post.dto';
import { NotificationService } from '../../common/notifications/notification.service';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private postsRepository: PostsRepository,
    private notificationService: NotificationService,
  ) {}

  private truncateBody(body?: string, maxLength: number = 200): string {
    if (!body) return '';
    return body.length > maxLength
      ? body.substring(0, maxLength) + '...'
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
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
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
        body: this.truncateBody(post.body ?? ''),
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

  async getPostsMine(user_id: string, offset = 0, limit = 10) {
    const posts = await this.postsRepository.getPostsByCreator(
      user_id,
      offset,
      limit,
    );
    const totalItems = await this.postsRepository.getPostsByCreatorCount(user_id);
    const totalPages = Math.ceil(totalItems / limit);
    
    const metadata = {
      total_items: totalItems,
      offset: offset,
      limit: limit,
      total_pages: totalPages,
    };
    return { posts, metadata };
  }

  findById(id: string) {
    return this.prisma.posts.findUnique({ where: { id: id } });
  }

  async getPostRandom(limit: number = 6) {
    const postsData = await this.postsRepository.findPostRandom(limit);
    return postsData.map((post) => ({
      ...post,
      body: this.truncateBody(post.body ?? ''),
    }));
  }

  createComment(data: any) {
    data.created_at = new Date();
    return this.prisma.post_comments.create({ data });
  }

  getAllComments(postId: string): Promise<post_comments[]> {
    return this.prisma.post_comments.findMany({
      where: { post_id: postId, parrent_comment_id: null },
      orderBy: { created_at: 'asc' },
      include: { creator: true },
    });
  }

  getByUsernameAndSlug(username: string, slug: string) {
    return this.postsRepository.findByUsernameAndSlug(username, slug);
  }

  deletePost(post_id: string) {
    return this.prisma.posts.delete({ where: { id: post_id } });
  }

  async createPost(postData: CreatePostDto, user_id: string) {
    // remove property tags

    const newpost = await this.prisma.posts.create({
      data: {
        created_by: user_id,
        created_at: new Date(),
        title: postData.title,
        body: postData.body,
        slug: postData.slug,
        published: true,
      },
    });

    // Send email notifications for new post
    if (newpost.published && newpost.title && newpost.slug) {
      // Get author information for the notification
      const author = await this.prisma.users.findUnique({
        where: { id: user_id },
        select: { username: true, first_name: true, last_name: true },
      });

      const authorName = author?.username || 
        `${author?.first_name || ''} ${author?.last_name || ''}`.trim() || 
        'Unknown Author';

      // Extract excerpt from post body (first 200 characters)
      const postExcerpt = this.truncateBody(newpost.body || '', 200);

      // Trigger notification asynchronously (don't wait for it to complete)
      this.notificationService.notifyNewPost({
        postId: newpost.id,
        postTitle: newpost.title,
        postSlug: newpost.slug,
        authorName,
        postExcerpt,
      }).catch(error => {
        // Log error but don't fail the post creation
        console.error('Failed to send new post notification:', error);
      });
    }

    return newpost;
  }
  async updatePublishPost(post_id: string, published: boolean = true) {
    const post = await this.prisma.posts.update({
      where: { id: post_id },
      data: { published },
    });
    return post;
  }

  async likePost(likePostDto: LikePostDto, user_id: string) {
    const { post_id } = likePostDto;
    
    // Check if post exists
    const post = await this.prisma.posts.findUnique({
      where: { id: post_id },
    });
    
    if (!post) {
      throw new NotFoundException('Post not found');
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
      throw new NotFoundException('Post not found');
    }
    
    // Find the like
    const existingLike = await this.prisma.likes.findFirst({
      where: {
        post_id,
        user_id,
      },
    });
    
    if (!existingLike) {
      throw new NotFoundException('Like not found');
    }
    
    // Delete the like
    await this.prisma.likes.delete({
      where: { id: existingLike.id },
    });
    
    return { success: true, message: 'Post unliked successfully' };
  }
  
  async getPostLikes(post_id: string) {
    // Check if post exists
    const post = await this.prisma.posts.findUnique({
      where: { id: post_id },
    });
    
    if (!post) {
      throw new NotFoundException('Post not found');
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
      users: likes.map(like => like.users),
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
