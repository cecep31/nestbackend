import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  ParseUUIDPipe,
  Req,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import type {
  CreateUserDto,
  UpdateUserDto,
  ResetPasswordDto,
} from './dto/user.schema';
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
} from './dto/user.schema';
import type { FollowUserDto } from './dto/follow.schema';
import { followUserSchema } from './dto/follow.schema';
import { SuperAdminGuard } from '../auth/guards/superadmin.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createUserSchema)) createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Put(':id/reset-password')
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(resetPasswordSchema))
    resetPasswordDto: ResetPasswordDto,
  ) {
    return this.usersService.resetPassword(id, resetPasswordDto);
  }

  @Get()
  async findAll(
    @Query('offset') offset: number = 0,
    @Query('limit') limit: number = 10,
  ) {
    const { users, metadata } = await this.usersService.findAll(offset, limit);
    return {
      success: true,
      data: users,
      metadata,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    const user = await this.usersService.getMyProfile(req.user.user_id);
    const followStats = await this.usersService.getFollowStats(
      req.user.user_id,
    );
    return {
      success: true,
      data: { ...user, ...followStats },
    };
  }

  // Follow endpoints
  @UseGuards(JwtAuthGuard)
  @Post('follow')
  async followUser(
    @Body(new ZodValidationPipe(followUserSchema)) followUserDto: FollowUserDto,
    @Req() req: any,
  ) {
    await this.usersService.followUser(req.user.user_id, followUserDto.user_id);
    return {
      success: true,
      message: 'Successfully followed user',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  async unfollowUser(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    await this.usersService.unfollowUser(req.user.user_id, id);
    return {
      success: true,
      message: 'Successfully unfollowed user',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/follow-status')
  async getFollowStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const data = await this.usersService.getFollowStatus(req.user.user_id, id);
    return {
      success: true,
      message: 'Follow status retrieved',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/mutual-follows')
  async getMutualFollows(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Query('offset') offset: number = 0,
    @Query('limit') limit: number = 10,
  ) {
    const data = await this.usersService.getMutualFollows(
      req.user.user_id,
      id,
      offset,
      limit,
    );
    return {
      success: true,
      message: 'Mutual follows retrieved',
      data: data.mutual_follows,
      meta: data.metadata,
    };
  }

  @Get(':id/followers')
  async getFollowers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('offset') offset: number = 0,
    @Query('limit') limit: number = 10,
  ) {
    const data = await this.usersService.getFollowers(id, offset, limit);
    return {
      success: true,
      message: 'Followers retrieved',
      data: data.followers,
      meta: data.metadata,
    };
  }

  @Get(':id/following')
  async getFollowing(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('offset') offset: number = 0,
    @Query('limit') limit: number = 10,
  ) {
    const data = await this.usersService.getFollowing(id, offset, limit);
    return {
      success: true,
      message: 'Following retrieved',
      data: data.following,
      meta: data.metadata,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/follow-stats')
  async getFollowStats(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.usersService.getFollowStats(id);
    return {
      success: true,
      message: 'Follow statistics retrieved',
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const currentUserId = req.user?.user_id;
    const data = await this.usersService.getUserWithFollowInfo(
      id,
      currentUserId,
    );
    return {
      success: true,
      message: 'Successfully retrieved user',
      data,
    };
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
