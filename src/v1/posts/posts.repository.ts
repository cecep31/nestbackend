import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../db/prisma.service";
import { Prisma, posts } from "../../generated/prisma/client";

@Injectable()
export class PostsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.postsCreateInput): Promise<posts> {
    return this.prisma.posts.create({ data });
  }

  async findAll(params?: {
    offset?: number;
    take?: number;
    where?: Prisma.postsWhereInput;
    orderBy?: Prisma.postsOrderByWithRelationInput;
    include?: Prisma.postsInclude;
  }) {
    const { offset, take, where, orderBy, include } = params || {};
    return this.prisma.posts.findMany({
      skip: offset || 0,
      take,
      where,
      orderBy,
      include: {
        ...include,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async findOne(
    where: Prisma.postsWhereUniqueInput,
    include?: Prisma.postsInclude
  ) {
    return this.prisma.posts.findUnique({
      where,
      include,
    });
  }

  async getPostsByCreator(user_id: string, offset = 0, limit = 10) {
    return this.prisma.posts.findMany({
      where: {
        created_by: user_id,
        deleted_at: null,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
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
      skip: offset,
      take: limit,
      orderBy: {
        created_at: "desc",
      },
    });
  }

  async getPostsByCreatorCount(creator_id: string) {
    return this.prisma.posts.count({
      where: {
        created_by: creator_id,
        deleted_at: null,
      },
    });
  }

  async findBySlug(slug: string): Promise<posts | null> {
    return this.prisma.posts.findFirst({
      where: { slug },
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
  }

  async findByUsernameAndSlug(
    username: string,
    slug: string
  ): Promise<posts | null> {
    return this.prisma.posts.findFirst({
      where: { creator: { username }, slug: slug },
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
  }

  async update(params: {
    where: Prisma.postsWhereUniqueInput;
    data: Prisma.postsUpdateInput;
  }): Promise<posts> {
    const { where, data } = params;
    return this.prisma.posts.update({
      data,
      where,
    });
  }

  async delete(where: Prisma.postsWhereUniqueInput): Promise<posts> {
    return this.prisma.posts.delete({ where });
  }

  async softDelete(id: string): Promise<posts> {
    return this.prisma.posts.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async findPostRandom(limit: number = 6) {
    return this.prisma.$queryRaw<posts[]>`
      SELECT p.*, 
        json_build_object('id', u.id, 'username', u.username, 'email', u.email) as creator,
        (
          SELECT json_agg(json_build_object('id', t.id, 'name', t.name))
          FROM posts_to_tags pt
          JOIN tags t ON pt.tag_id = t.id
          WHERE pt.post_id = p.id
        ) as tags
      FROM posts p
      JOIN users u ON p.created_by = u.id
      WHERE p.deleted_at IS NULL
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;
  }

  async findPublishedPosts(params?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.postsOrderByWithRelationInput;
  }) {
    const { skip, take, orderBy } = params || {};
    return this.prisma.posts.findMany({
      where: {
        published: true,
        deleted_at: null,
      },
      skip,
      take,
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
        post_likes: true,
        post_comments: false,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async countUserPosts(userId: string): Promise<number> {
    return this.prisma.posts.count({
      where: {
        created_by: userId,
        deleted_at: null,
      },
    });
  }

  async bookmarkPost(postId: string, userId: string) {
    return this.prisma.post_bookmarks.create({
      data: {
        post_id: postId,
        user_id: userId,
        created_at: new Date(),
      },
    });
  }

  async unbookmarkPost(postId: string, userId: string) {
    return this.prisma.post_bookmarks.deleteMany({
      where: {
        post_id: postId,
        user_id: userId,
      },
    });
  }

  async findBookmark(postId: string, userId: string) {
    return this.prisma.post_bookmarks.findFirst({
      where: {
        post_id: postId,
        user_id: userId,
      },
    });
  }

  async getUserBookmarks(userId: string, offset = 0, limit = 10) {
    return this.prisma.post_bookmarks.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
      },
      include: {
        posts: {
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
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      skip: offset,
      take: limit,
    });
  }

  async getUserBookmarksCount(userId: string): Promise<number> {
    return this.prisma.post_bookmarks.count({
      where: {
        user_id: userId,
        deleted_at: null,
      },
    });
  }

  async getPostBookmarks(postId: string) {
    return this.prisma.post_bookmarks.findMany({
      where: {
        post_id: postId,
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
  }

  async getPostBookmarksCount(postId: string): Promise<number> {
    return this.prisma.post_bookmarks.count({
      where: {
        post_id: postId,
        deleted_at: null,
      },
    });
  }

  async recordView(
    postId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    return this.prisma.post_views.create({
      data: {
        post_id: postId,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date(),
      },
    });
  }

  async getPostViews(postId: string) {
    return this.prisma.post_views.findMany({
      where: {
        post_id: postId,
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
  }

  async getPostViewsCount(postId: string): Promise<number> {
    return this.prisma.post_views.count({
      where: {
        post_id: postId,
        deleted_at: null,
      },
    });
  }

  async incrementPostViewCount(postId: string) {
    return this.prisma.posts.update({
      where: { id: postId },
      data: {
        view_count: {
          increment: 1,
        },
      },
    });
  }
}
