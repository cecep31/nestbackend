import { Test, TestingModule } from '@nestjs/testing';
import { AdminPostsController } from './admin-posts.controller';
import { PostsService } from '../posts.service';
import { SuperAdminGuard } from '../../auth/guards/superadmin.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AdminPostsController', () => {
  let controller: AdminPostsController;
  let service: PostsService;

  const mockPostsService = {
    getAdminPosts: jest.fn(),
    getAdminPostStats: jest.fn(),
    findById: jest.fn(),
    adminCreatePost: jest.fn(),
    adminUpdatePost: jest.fn(),
    adminBulkOperation: jest.fn(),
    updatePublishPost: jest.fn(),
    deletePost: jest.fn(),
  };

  const mockSuperAdminGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminPostsController],
      providers: [
        {
          provide: PostsService,
          useValue: mockPostsService,
        },
        {
          provide: SuperAdminGuard,
          useValue: mockSuperAdminGuard,
        },
      ],
    }).compile();

    controller = module.get<AdminPostsController>(AdminPostsController);
    service = module.get<PostsService>(PostsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated posts with metadata', async () => {
      const mockQuery = {
        offset: 0,
        limit: 10,
        published: 'all' as const,
        sort_by: 'created_at' as const,
        sort_order: 'desc' as const,
      };

      const mockResult = {
        posts: [
          {
            id: '1',
            title: 'Test Post',
            body: 'Test content',
            published: true,
            creator: { id: '1', username: 'testuser' },
            tags: [],
            stats: { likes: 0, comments: 0 },
          },
        ],
        metadata: {
          total_items: 1,
          offset: 0,
          limit: 10,
          total_pages: 1,
        },
      };

      mockPostsService.getAdminPosts.mockResolvedValue(mockResult);

      const result = await controller.findAll(mockQuery);

      expect(result).toEqual({
        success: true,
        message: 'Successfully fetched posts',
        data: mockResult.posts,
        meta: mockResult.metadata,
      });
      expect(service.getAdminPosts).toHaveBeenCalledWith(mockQuery);
    });

    it('should handle errors gracefully', async () => {
      const mockQuery = {
        offset: 0,
        limit: 10,
        published: 'all' as const,
        sort_by: 'created_at' as const,
        sort_order: 'desc' as const,
      };
      const error = new Error('Database error');
      mockPostsService.getAdminPosts.mockRejectedValue(error);

      await expect(controller.findAll(mockQuery)).rejects.toThrow(error);
    });
  });

  describe('getPostStats', () => {
    it('should return post statistics', async () => {
      const mockStats = {
        total: 100,
        published: 80,
        unpublished: 15,
        deleted: 5,
        thisMonth: 10,
        lastMonth: 8,
        growth: '25.00',
      };

      mockPostsService.getAdminPostStats.mockResolvedValue(mockStats);

      const result = await controller.getPostStats();

      expect(result).toEqual({
        success: true,
        message: 'Successfully fetched post statistics',
        data: mockStats,
      });
      expect(service.getAdminPostStats).toHaveBeenCalled();
    });
  });

  describe('getPost', () => {
    it('should return a specific post', async () => {
      const mockPost = {
        id: '1',
        title: 'Test Post',
        body: 'Test content',
        published: true,
      };

      mockPostsService.findById.mockResolvedValue(mockPost);

      const result = await controller.getPost('1');

      expect(result).toEqual({
        success: true,
        message: 'Successfully fetched post',
        data: mockPost,
      });
      expect(service.findById).toHaveBeenCalledWith('1');
    });

    it('should return not found when post does not exist', async () => {
      mockPostsService.findById.mockResolvedValue(null);

      const result = await controller.getPost('1');

      expect(result).toEqual({
        success: false,
        message: 'Post not found',
        data: null,
      });
    });
  });

  describe('createPost', () => {
    it('should create a new post', async () => {
      const createDto = {
        title: 'New Post',
        body: 'New content',
        published: true,
        tags: ['test'],
      };

      const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const mockCreatedPost = {
        id: '1',
        ...createDto,
        created_at: new Date(),
      };

      mockPostsService.adminCreatePost.mockResolvedValue(mockCreatedPost);

      const result = await controller.createPost(createDto, mockFile);

      expect(result).toEqual({
        success: true,
        message: 'Successfully created post',
        data: mockCreatedPost,
      });
      expect(service.adminCreatePost).toHaveBeenCalledWith(createDto, mockFile);
    });

    it('should handle creation errors', async () => {
      const createDto = {
        title: 'New Post',
        body: 'New content',
        published: true,
        tags: [],
      };
      const error = new BadRequestException('Invalid data');
      mockPostsService.adminCreatePost.mockRejectedValue(error);

      await expect(controller.createPost(createDto, undefined as any)).rejects.toThrow(error);
    });
  });

  describe('updatePost', () => {
    it('should update an existing post', async () => {
      const updateDto = {
        id: '1',
        title: 'Updated Post',
        body: 'Updated content',
      };

      const mockFile = {
        originalname: 'updated.jpg',
        buffer: Buffer.from('updated'),
      } as Express.Multer.File;

      const mockUpdatedPost = {
        ...updateDto,
        id: '1',
        updated_at: new Date(),
      };

      mockPostsService.adminUpdatePost.mockResolvedValue(mockUpdatedPost);

      const result = await controller.updatePost(updateDto, mockFile);

      expect(result).toEqual({
        success: true,
        message: 'Successfully updated post',
        data: mockUpdatedPost,
      });
      expect(service.adminUpdatePost).toHaveBeenCalledWith(updateDto, mockFile);
    });

    it('should handle update errors', async () => {
      const updateDto = { id: '1', title: 'Updated Post' };
      const error = new NotFoundException('Post not found');
      mockPostsService.adminUpdatePost.mockRejectedValue(error);

      await expect(controller.updatePost(updateDto, undefined as any)).rejects.toThrow(error);
    });
  });

  describe('bulkOperation', () => {
    it('should process bulk operations successfully', async () => {
      const bulkDto = {
        post_ids: ['1', '2', '3'],
        operation: 'publish' as const,
      };

      const mockResult = {
        total: 3,
        successful: 3,
        failed: 0,
        results: [
          { id: '1', success: true, data: {} },
          { id: '2', success: true, data: {} },
          { id: '3', success: true, data: {} },
        ],
      };

      mockPostsService.adminBulkOperation.mockResolvedValue(mockResult);

      const result = await controller.bulkOperation(bulkDto);

      expect(result).toEqual({
        success: true,
        message: 'Successfully processed 3 posts',
        data: mockResult,
      });
      expect(service.adminBulkOperation).toHaveBeenCalledWith(bulkDto);
    });
  });

  describe('updatePublishPost', () => {
    it('should update post publish status', async () => {
      const mockUpdatedPost = {
        id: '1',
        published: false,
        updated_at: new Date(),
      };

      mockPostsService.updatePublishPost.mockResolvedValue(mockUpdatedPost);

      const result = await controller.updatePublishPost('1', false);

      expect(result).toEqual({
        success: true,
        message: 'Successfully updated post publish status',
        data: mockUpdatedPost,
      });
      expect(service.updatePublishPost).toHaveBeenCalledWith('1', false);
    });
  });

  describe('deletePost', () => {
    it('should delete a post', async () => {
      mockPostsService.deletePost.mockResolvedValue({ id: '1' });

      const result = await controller.deletePost('1');

      expect(result).toEqual({
        success: true,
        message: 'Successfully deleted post',
        data: null,
      });
      expect(service.deletePost).toHaveBeenCalledWith('1');
    });

    it('should handle delete errors', async () => {
      const error = new NotFoundException('Post not found');
      mockPostsService.deletePost.mockRejectedValue(error);

      await expect(controller.deletePost('1')).rejects.toThrow(error);
    });
  });
});