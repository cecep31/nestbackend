import { Test, TestingModule } from '@nestjs/testing';
import { PostsGateway } from './posts.gateway';
import { PostsService } from './posts.service';
import { AuthService } from '../auth/auth.service';
import { UserSocketMapService } from './user-map-service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../db/prisma.service';
import { PostsRepository } from './posts.repository';
// import { NotificationService } from '../../common/notifications/notification.service';
// import { EmailService } from '../../common/email/email.service';

describe('PostsGateway', () => {
  let gateway: PostsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsGateway,
        PostsService,
        AuthService,
        UserSocketMapService,
        PostsRepository,
        // NotificationService,
        // EmailService,
        {
          provide: JwtService,
          useValue: {
            // Mock JwtService methods as needed
            sign: jest.fn().mockReturnValue('test-token'),
            verify: jest.fn().mockReturnValue({ userId: 'test-user-id' }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            // Mock ConfigService methods as needed
            get: jest.fn((key: string) => {
              switch (key) {
                case 'JWT_SECRET':
                  return 'test-secret';
                case 'JWT_EXPIRES_IN':
                  return '1h';
                case 'resend.apiKey':
                  return 'test-api-key';
                case 'resend.fromEmail':
                  return 'test@example.com';
                default:
                  return null;
              }
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            // Mock PrismaService methods as needed
          },
        },
      ],
    }).compile();

    gateway = module.get<PostsGateway>(PostsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
