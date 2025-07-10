import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
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
                'resend.apiKey': 'test-api-key',
                'resend.fromEmail': 'test@example.com',
                'app.baseUrl': 'http://localhost:3000',
              };
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

  it('should initialize with config', () => {
    expect(configService.get).toHaveBeenCalledWith('resend.apiKey');
    expect(configService.get).toHaveBeenCalledWith('resend.fromEmail');
  });

  describe('sendNewPostNotification', () => {
    it('should return true when no subscribers', async () => {
      const result = await service.sendNewPostNotification(
        [],
        'Test Post',
        'test-post',
        'Test Author'
      );
      expect(result).toBe(true);
    });

    it('should handle notification data correctly', async () => {
      const subscriberEmails = ['user1@example.com', 'user2@example.com'];
      const postTitle = 'Amazing New Post';
      const postSlug = 'amazing-new-post';
      const authorName = 'John Doe';
      const postExcerpt = 'This is an amazing post about...';

      // Mock the sendEmail method to avoid actual email sending in tests
      const sendEmailSpy = jest.spyOn(service, 'sendEmail').mockResolvedValue(true);

      const result = await service.sendNewPostNotification(
        subscriberEmails,
        postTitle,
        postSlug,
        authorName,
        postExcerpt
      );

      expect(sendEmailSpy).toHaveBeenCalledWith({
        to: subscriberEmails,
        subject: `New Post: ${postTitle}`,
        html: expect.stringContaining(postTitle),
      });
      expect(result).toBe(true);

      sendEmailSpy.mockRestore();
    });
  });
});