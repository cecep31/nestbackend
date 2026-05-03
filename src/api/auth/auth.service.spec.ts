import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const configService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'jwt_secret':
          return 'test-secret';
        default:
          return null;
      }
    }),
  };
  const prismaService = {
    sessions: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should issue an access token for a valid refresh token session', async () => {
    prismaService.sessions.findUnique.mockResolvedValue({
      refresh_token: 'pl_valid',
      expires_at: new Date(Date.now() + 60_000),
      users: {
        id: 'user-1',
        email: 'user@example.com',
        is_super_admin: false,
        deleted_at: null,
      },
    });
    jwtService.signAsync.mockResolvedValue('new-access-token');

    await expect(service.refreshToken('pl_valid')).resolves.toEqual({
      access_token: 'new-access-token',
    });

    expect(prismaService.sessions.findUnique).toHaveBeenCalledWith({
      where: {
        refresh_token: 'pl_valid',
      },
      include: {
        users: true,
      },
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      user_id: 'user-1',
      email: 'user@example.com',
      is_super_admin: false,
    });
  });

  it('should reject an unknown refresh token', async () => {
    prismaService.sessions.findUnique.mockResolvedValue(null);

    await expect(service.refreshToken('pl_missing')).rejects.toThrow(
      new UnauthorizedException('Invalid refresh token'),
    );
  });

  it('should reject and delete an expired refresh token session', async () => {
    prismaService.sessions.findUnique.mockResolvedValue({
      refresh_token: 'pl_expired',
      expires_at: new Date(Date.now() - 60_000),
      users: {
        id: 'user-1',
        email: 'user@example.com',
        is_super_admin: false,
        deleted_at: null,
      },
    });

    await expect(service.refreshToken('pl_expired')).rejects.toThrow(
      new UnauthorizedException('Refresh token expired'),
    );
    expect(prismaService.sessions.delete).toHaveBeenCalledWith({
      where: {
        refresh_token: 'pl_expired',
      },
    });
  });
});
