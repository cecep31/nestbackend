import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateUserDto,
  UpdateUserDto,
  ResetPasswordDto,
} from './schemas/user.schema';
import { hash } from 'bcrypt';
import { PrismaService } from '../../db/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { UserRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private userReposistory: UserRepository,
  ) {}

  async hashPassword(password: string) {
    return await hash(password, 14);
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const hashedPassword = await this.hashPassword(createUserDto.password);
      const user = await this.prisma.users.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
        select: {
          id: true,
          username: true,
          email: true,
          image: true,
          created_at: true,
          updated_at: true,
          deleted_at: true,
          first_name: true,
          last_name: true,
          password: true,
          is_super_admin: true,
        },
      });
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Username or email already exists');
        }
      }
      throw error;
    }
  }

  async getUserProfile(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        image: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        first_name: true,
        last_name: true,
        password: false,
        is_super_admin: true,
        profile: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Return the cached user data instead of making another DB query
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.findOne(id);
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const data = { ...updateUserDto };
      if (updateUserDto.password) {
        data.password = await this.hashPassword(updateUserDto.password);
      }

      return await this.prisma.users.update({
        where: { id },
        data,
        select: {
          id: true,
          username: true,
          email: true,
          image: true,
          updated_at: true,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Username or email already exists');
        }
      }
      throw error;
    }
  }

  async getMyProfile(id: string) {
    const user = await this.userReposistory.FindUserById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Return the cached user data instead of making another DB query
    return user;
  }

  async resetPassword(id: string, resetPasswordDto: ResetPasswordDto) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const hashedPassword = await this.hashPassword(
      resetPasswordDto.newPassword,
    );
    return await this.prisma.users.update({
      where: { id },
      data: { password: hashedPassword },
      select: {
        id: true,
        username: true,
        email: true,
        updated_at: true,
      },
    });
  }

  async findAll(offset: number, limit: number) {
    const users = await this.userReposistory.getAllUsers({
      skip: offset,
      take: limit,
    });
    const total = await this.userReposistory.getAllUsersCount();
    return {
      users,
      metadata: {
        totalItems: total,
        offset,
        limit,
      },
    };
  }

  async findByEmailOrUsername(usernameOrEmail: string) {
    return await this.prisma.users.findFirst({
      where: {
        OR: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
      },
      select: {
        id: true,
        username: true,
        email: true,
        image: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        first_name: true,
        last_name: true,
        password: true,
        is_super_admin: true,
      },
    });
  }

  async findOne(id: string) {
    return await this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        image: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async remove(id: string) {
    try {
      await this.prisma.users.delete({ where: { id } });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
      }
      throw error;
    }
  }

  async checkUsernameAvailability(username: string) {
    const existingUser = await this.prisma.users.findUnique({
      where: { username },
      select: { id: true },
    });

    return {
      username,
      available: !existingUser,
    };
  }

  // Follow system methods
  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    // Check if users exist
    const [follower, following] = await Promise.all([
      this.findOne(followerId),
      this.findOne(followingId),
    ]);

    if (!follower || !following) {
      throw new NotFoundException('User not found');
    }

    // Check if already following
    const existingFollow = await this.prisma.user_follows.findFirst({
      where: {
        follower_id: followerId,
        following_id: followingId,
      },
    });

    if (existingFollow) {
      throw new BadRequestException('Already following this user');
    }

    return await this.prisma.user_follows.create({
      data: {
        follower_id: followerId,
        following_id: followingId,
      },
    });
  }

  async unfollowUser(followerId: string, followingId: string) {
    const existingFollow = await this.prisma.user_follows.findFirst({
      where: {
        follower_id: followerId,
        following_id: followingId,
      },
    });

    if (!existingFollow) {
      throw new NotFoundException('Not following this user');
    }

    await this.prisma.user_follows.delete({
      where: {
        id: existingFollow.id,
      },
    });

    return { message: 'Successfully unfollowed user' };
  }

  async getFollowStatus(followerId: string, followingId: string) {
    const follow = await this.prisma.user_follows.findFirst({
      where: {
        follower_id: followerId,
        following_id: followingId,
      },
    });

    return {
      is_following: !!follow,
      followed_at: follow?.created_at || null,
    };
  }

  async getFollowStats(userId: string) {
    const [followersCount, followingCount] = await Promise.all([
      this.prisma.user_follows.count({
        where: { following_id: userId },
      }),
      this.prisma.user_follows.count({
        where: { follower_id: userId },
      }),
    ]);

    return {
      followers_count: followersCount,
      following_count: followingCount,
    };
  }

  async getFollowers(userId: string, offset: number = 0, limit: number = 10) {
    const followers = await this.prisma.user_follows.findMany({
      where: { following_id: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
            image: true,
            created_at: true,
          },
        },
      },
      skip: offset,
      take: limit,
      orderBy: { created_at: 'desc' },
    });

    const total = await this.prisma.user_follows.count({
      where: { following_id: userId },
    });

    return {
      followers: followers.map((f) => f.follower),
      metadata: {
        totalItems: total,
        offset,
        limit,
      },
    };
  }

  async getFollowing(userId: string, offset: number = 0, limit: number = 10) {
    const following = await this.prisma.user_follows.findMany({
      where: { follower_id: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
            image: true,
            created_at: true,
          },
        },
      },
      skip: offset,
      take: limit,
      orderBy: { created_at: 'desc' },
    });

    const total = await this.prisma.user_follows.count({
      where: { follower_id: userId },
    });

    return {
      following: following.map((f) => f.following),
      metadata: {
        totalItems: total,
        offset,
        limit,
      },
    };
  }

  async getMutualFollows(
    userId: string,
    targetUserId: string,
    offset: number = 0,
    limit: number = 10,
  ) {
    // Get users that both userId and targetUserId follow
    const mutualFollows = await this.prisma.user_follows.findMany({
      where: {
        AND: [
          { follower_id: userId },
          {
            following_id: {
              in: await this.prisma.user_follows
                .findMany({
                  where: { follower_id: targetUserId },
                  select: { following_id: true },
                })
                .then((follows) => follows.map((f) => f.following_id)),
            },
          },
        ],
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
            image: true,
            created_at: true,
          },
        },
      },
      skip: offset,
      take: limit,
    });

    return {
      mutual_follows: mutualFollows.map((f) => f.following),
      metadata: {
        totalItems: mutualFollows.length,
        offset,
        limit,
      },
    };
  }

  async getUserWithFollowInfo(userId: string, currentUserId?: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        image: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const followStats = await this.getFollowStats(userId);
    let isFollowing = false;

    if (currentUserId && currentUserId !== userId) {
      const followStatus = await this.getFollowStatus(currentUserId, userId);
      isFollowing = followStatus.is_following;
    }

    return {
      ...user,
      ...followStats,
      is_following: isFollowing,
    };
  }
}
