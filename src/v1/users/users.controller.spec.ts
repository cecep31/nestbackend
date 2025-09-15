import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../../db/prisma.service';
import { UserRepository } from './users.repository';
import { CreateUserDto, UpdateUserDto } from './schemas/user.schema';
import { BadRequestException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    created_at: new Date(),
    updated_at: new Date(),
    first_name: 'Test',
    last_name: 'User',
    is_super_admin: false,
  };

  const mockUsers = [
    mockUser,
    { ...mockUser, id: '2', username: 'testuser2' },
  ];

  const mockMetadata = {
    total: 2,
    page: 1,
    limit: 10,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        UserRepository,
        {
          provide: PrismaService,
          useValue: {
            // Mock PrismaService methods as needed
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of users with metadata', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue({
        users: mockUsers,
        metadata: mockMetadata,
      });

      const result = await controller.findAll(0, 10);

      expect(service.findAll).toHaveBeenCalledWith(0, 10);
      expect(result).toEqual({
        success: true,
        data: mockUsers,
        metadata: mockMetadata,
      });
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const req = { user: { user_id: '1' } };
      jest.spyOn(service, 'getUserWithFollowInfo').mockResolvedValue(mockUser);

      const result = await controller.findOne('1', req as any);

      expect(service.getUserWithFollowInfo).toHaveBeenCalledWith('1', '1');
      expect(result).toEqual({
        success: true,
        message: 'Successfully retrieved user',
        data: mockUser,
      });
    });
  });
});
