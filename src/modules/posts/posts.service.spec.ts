import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { PrismaService } from '../../db/prisma.service';
import { PostsRepository } from './posts.repository';
import { NotificationService } from '../../common/notifications/notification.service';
import { EmailService } from '../../common/email/email.service';
import { ConfigService } from '@nestjs/config';

describe('PostsService', () => {
  let service: PostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        PostsRepository,
        NotificationService,
        EmailService,
        {
          provide: PrismaService,
          useValue: {
            // Mock PrismaService methods as needed
          },
        },
        {
          provide: ConfigService,
          useValue: {
            // Mock ConfigService methods as needed
            get: jest.fn((key: string) => {
              switch (key) {
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
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

describe('PostsService', () => {
  let service: PostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        PostsRepository,
        NotificationService,
        EmailService,
        {
          provide: PrismaService,
          useValue: {
            // Mock PrismaService methods as needed
            posts: {
              findUnique: jest.fn().mockResolvedValue({ id: '123', title: 'Test Post' }),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            // Mock ConfigService methods as needed
            get: jest.fn((key: string) => {
              switch (key) {
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
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return the post with the specified id', async () => {
      // Arrange
      const id = '123';

      // Act
      const result = await service.findById(id);

      // Assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe(id);
      }
    });
  });
});