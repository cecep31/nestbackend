import { Test, TestingModule } from "@nestjs/testing";
import { PostsController } from "./posts.controller";
import { PostsService } from "../posts.service";
import { PrismaService } from "../../../db/prisma.service";
import { PostsRepository } from "../posts.repository";
import { ConfigService } from "@nestjs/config";

describe("PostsController", () => {
  let controller: PostsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        PostsService,
        PostsRepository,
        // NotificationService,
        // EmailService,
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
                case "resend.apiKey":
                  return "test-api-key";
                case "resend.fromEmail":
                  return "test@example.com";
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
