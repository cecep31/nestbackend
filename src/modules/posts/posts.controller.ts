import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { SuperAdminGuard } from '../auth/guards/superadmin.guard';
import { CreatePostDto, CreatePostSchema } from './dto/create-post.dto';
import { LikePostDto, LikePostSchema } from './dto/like-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Posts')
@Controller({
  version: '1',
  path: 'posts',
})
export class PostsController {
  constructor(private postsService: PostsService) { }

  @Get()
  @ApiOperation({ summary: 'Get all posts with pagination' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of posts to skip' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of posts to return' })
  @ApiResponse({ status: 200, description: 'Successfully fetched posts' })
  async findAll(
    @Query('offset') offset: number = 0,
    @Query('limit') limit: number = 10,
  ) {
    const { metadata, postsData } = await this.postsService.posts({
      offset,
      limit,
    });
    return {
      success: true,
      message: 'Successfully fetched posts',
      data: postsData,
      metadata,
    };
  }

  @Get('u/:username/:slug')
  @ApiOperation({ summary: 'Get post by username and slug' })
  @ApiParam({ name: 'username', description: 'Username of the post author' })
  @ApiParam({ name: 'slug', description: 'Post slug' })
  @ApiResponse({ status: 200, description: 'Successfully fetched post' })
  async getByUsernameAndSlug(
    @Param('username') username: string,
    @Param('slug') slug: string,
  ) {
    return {
      success: true,
      message: 'Successfully fetched post',
      data: await this.postsService.getByUsernameAndSlug(username, slug),
    };
  }

  @Get('/random')
  @ApiOperation({ summary: 'Get random posts' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of random posts to return', example: 9 })
  @ApiResponse({ status: 200, description: 'Successfully fetched random posts' })
  async getPostRandom(@Query('limit') limit: number = 9) {
    return {
      success: true,
      message: 'Successfully fetched random posts',
      data: await this.postsService.getPostRandom(limit),
    };
  }
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get posts created by the authenticated user' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of posts to skip' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of posts to return' })
  @ApiResponse({ status: 200, description: 'Successfully fetched user posts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPostsByCreator(
    @Request() req,
    @Query('offset') offset: number = 0,
    @Query('limit') limit: number = 10,
  ) {
    const { metadata, posts } = await this.postsService.getPostsMine(
      req.user.user_id,
      offset,
      limit,
    );
    return {
      success: true,
      message: 'Successfully fetched posts',
      data: posts,
      metadata,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Successfully fetched post' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async post(
    @Param('id') id: string,
  ) {
    const post = await this.postsService.findById(id);
    if (!post) {
      return {
        success: false,
        message: 'Post not found',
        data: [],
      };
    }
    return {
      success: true,
      message: 'Successfully fetched post',
      data: post,
    };
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete post (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Post ID to delete' })
  @ApiResponse({ status: 200, description: 'Successfully deleted post' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin access required' })
  async deletePost(@Param('id') id: string) {
    return {
      success: true,
      message: 'Successfully deleted post',
      data: await this.postsService.deletePost(id),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new post' })
  @ApiBody({ type: CreatePostDto, description: 'Post data' })
  @ApiResponse({ status: 201, description: 'Successfully created post' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid post data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPost(
    @Body(new ZodValidationPipe(CreatePostSchema)) createPostDto: CreatePostDto,
    @Request() req,
  ) {
    return {
      success: true,
      message: 'Successfully created post',
      data: await this.postsService.createPost(createPostDto, req.user.user_id),
    };
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Patch('publish')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update post publish status (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Post ID to update' })
  @ApiQuery({ name: 'published', required: false, type: Boolean, description: 'Publish status', example: true })
  @ApiResponse({ status: 200, description: 'Successfully updated post' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin access required' })
  async updatePublishPost(
    @Param('id') id: string,
    @Query('published') published: boolean = true,
  ) {
    return {
      success: true,
      message: 'Successfully updated post',
      data: await this.postsService.updatePublishPost(id, published),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('like')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Like a post' })
  @ApiBody({ type: LikePostDto, description: 'Like post data' })
  @ApiResponse({ status: 201, description: 'Successfully liked post' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid like data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async likePost(
    @Body(new ZodValidationPipe(LikePostSchema)) likePostDto: LikePostDto,
    @Request() req,
  ) {
    return {
      success: true,
      message: 'Successfully liked post',
      data: await this.postsService.likePost(likePostDto, req.user.user_id),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('like/:id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiParam({ name: 'id', description: 'Post ID to unlike' })
  @ApiResponse({ status: 200, description: 'Successfully unliked post' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found or not liked' })
  async unlikePost(
    @Param('id') id: string,
    @Request() req,
  ) {
    return {
      success: true,
      message: 'Successfully unliked post',
      data: await this.postsService.unlikePost(id, req.user.user_id),
    };
  }

  @Get(':id/likes')
  @ApiOperation({ summary: 'Get all likes for a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Successfully fetched post likes' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPostLikes(@Param('id') id: string) {
    return {
      success: true,
      message: 'Successfully fetched post likes',
      data: await this.postsService.getPostLikes(id),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/liked')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check if authenticated user liked a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Successfully checked if user liked post' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async checkUserLiked(
    @Param('id') id: string,
    @Request() req,
  ) {
    return {
      success: true,
      message: 'Successfully checked if user liked post',
      data: await this.postsService.checkUserLiked(id, req.user.user_id),
    };
  }
}
