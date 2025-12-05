import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  /**
   * Validate or register user via OAuth provider (GitHub)
   */
  async validateOAuthLogin({
    provider,
    providerId,
    username,
    email,
    photo,
    accessToken,
  }: {
    provider: string;
    providerId: string;
    username: string;
    email?: string;
    photo?: string;
    accessToken?: string;
  }) {
    // Try to find user by email or username
    let user = email
      ? await this.prisma.users.findUnique({
          where: {
            email,
          },
        })
      : null;

    // If still not found, create new user
    if (!user) {
      // Generate a secure random password for OAuth users
      const oauthPassword = await hash(randomBytes(32).toString('hex'), 10);

      // try if username is already taken
      try {
        user = await this.prisma.users.create({
          data: {
            username: username || provider + '_' + providerId,
            email: email || `${providerId}@${provider}.oauth`,
            password: oauthPassword, // Secure hashed password for OAuth users
            image: photo,
          },
        });
      } catch (error) {
        user = await this.prisma.users.create({
          data: {
            username: provider + '_' + providerId,
            email: email || `${providerId}@${provider}.oauth`,
            password: oauthPassword, // Secure hashed password for OAuth users
            image: photo,
          },
        });
      }

      if (!user) {
        throw new Error('User not found');
      }
    }

    // Generate JWT payload
    const payload = {
      user_id: user?.id,
      email: user?.email,
      is_super_admin: user?.is_super_admin,
      username: user?.username,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user?.id,
        email: user?.email,
        username: user?.username,
        image: user?.image,
      },
    };
  }

  comparePassword(hash: string, password: string) {
    return compare(password, hash);
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.users.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.comparePassword(
      user.password ?? '',
      password,
    );
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async signIn(email: string, password: string): Promise<any> {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException();
    }

    const payload = {
      user_id: user.id,
      email: user.email,
      is_super_admin: user.is_super_admin,
    };

    const refreshToken = 'pl_' + randomBytes(64).toString('hex');

    const session = await this.prisma.sessions.create({
      data: {
        user_id: user.id,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      access_token: await this.jwtService.signAsync(payload),
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  async verifyToken(token: string) {
    return await this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('jwt_secret'),
    });
  }

  // refresh token
  async refreshToken(payload: any) {
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  profile(user: any) {
    return this.prisma.users.findUnique({
      where: {
        id: user.id,
      },
    });
  }

  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<any> {
    const hashedPassword = await hash(password, 10);

    const user = await this.prisma.users.create({
      data: {
        username,
        email,
        password: hashedPassword,
        first_name: username,
        last_name: 'User',
      },
    });

    const payload = {
      user_id: user.id,
      email: user.email,
      is_super_admin: user.is_super_admin,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  async checkUsernameAvailability(username: string) {
    return await this.prisma.users.findUnique({
      where: {
        username,
      },
    });
  }
}
