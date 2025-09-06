import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'app.baseUrl': 'http://localhost:3000',
              };
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendNewPostNotification', () => {
    it('should return true when no subscribers', async () => {
      const result = await service.sendNewPostNotification(
        [],
        'Test Post',
        'test-post',
        'Test Author',
      );
      expect(result).toBe(true);
    });

    it('should handle notification data correctly', async () => {
      const subscriberEmails = ['user1@example.com', 'user2@example.com'];
      const postTitle = 'Amazing New Post';
      const postSlug = 'amazing-new-post';
      const authorName = 'John Doe';
      const postExcerpt = 'This is an amazing post about...';

      const result = await service.sendNewPostNotification(
        subscriberEmails,
        postTitle,
        postSlug,
        authorName,
        postExcerpt,
      );

      expect(result).toBe(true);
    });
  });
});
