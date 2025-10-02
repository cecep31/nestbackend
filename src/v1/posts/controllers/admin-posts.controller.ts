import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { PostsService } from "../posts.service";
import { SuperAdminGuard } from "../../auth/guards/superadmin.guard";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import {
  AdminCreatePostSchema,
  AdminUpdatePostSchema,
  AdminBulkOperationSchema,
  AdminPostQuerySchema,
  AdminCreatePostDto,
  AdminUpdatePostDto,
  AdminBulkOperationDto,
  AdminPostQueryDto,
} from "../dto/admin-posts.dto";

@Controller({
  version: "1",
  path: "admin/posts",
})
@UseGuards(SuperAdminGuard)
export class AdminPostsController {
  private readonly logger = new Logger(AdminPostsController.name);

  constructor(private postsService: PostsService) {}

  @Get()
  async findAll(
    @Query(new ZodValidationPipe(AdminPostQuerySchema)) query: AdminPostQueryDto
  ) {
    try {
      const { posts, metadata } = await this.postsService.getAdminPosts(query);
      
      return {
        success: true,
        message: "Successfully fetched posts",
        data: posts,
        meta: metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch admin posts: ${error.message}`);
      throw error;
    }
  }

  @Get("stats")
  async getPostStats() {
    try {
      const stats = await this.postsService.getAdminPostStats();
      
      return {
        success: true,
        message: "Successfully fetched post statistics",
        data: stats,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch post stats: ${error.message}`);
      throw error;
    }
  }

  @Get(":id")
  async getPost(@Param("id") id: string) {
    try {
      const post = await this.postsService.findById(id);
      if (!post) {
        return {
          success: false,
          message: "Post not found",
          data: null,
        };
      }
      
      return {
        success: true,
        message: "Successfully fetched post",
        data: post,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch post ${id}: ${error.message}`);
      throw error;
    }
  }

  @Post()
  @UseInterceptors(FileInterceptor("image"))
  async createPost(
    @Body(new ZodValidationPipe(AdminCreatePostSchema))
    createPostDto: AdminCreatePostDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    try {
      const post = await this.postsService.adminCreatePost(createPostDto, file);
      
      return {
        success: true,
        message: "Successfully created post",
        data: post,
      };
    } catch (error) {
      this.logger.error(`Failed to create post: ${error.message}`);
      throw error;
    }
  }

  @Put()
  @UseInterceptors(FileInterceptor("image"))
  async updatePost(
    @Body(new ZodValidationPipe(AdminUpdatePostSchema))
    updatePostDto: AdminUpdatePostDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    try {
      const post = await this.postsService.adminUpdatePost(updatePostDto, file);
      
      return {
        success: true,
        message: "Successfully updated post",
        data: post,
      };
    } catch (error) {
      this.logger.error(`Failed to update post ${updatePostDto.id}: ${error.message}`);
      throw error;
    }
  }

  @Patch("bulk")
  @HttpCode(HttpStatus.OK)
  async bulkOperation(
    @Body(new ZodValidationPipe(AdminBulkOperationSchema))
    bulkOperationDto: AdminBulkOperationDto
  ) {
    try {
      const result = await this.postsService.adminBulkOperation(bulkOperationDto);
      
      return {
        success: true,
        message: `Successfully processed ${result.successful} posts`,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to process bulk operation: ${error.message}`);
      throw error;
    }
  }

  @Patch(":id/publish")
  async updatePublishPost(
    @Param("id") id: string,
    @Query("published") published: boolean = true
  ) {
    try {
      const post = await this.postsService.updatePublishPost(id, published);
      
      return {
        success: true,
        message: "Successfully updated post publish status",
        data: post,
      };
    } catch (error) {
      this.logger.error(`Failed to update publish status for post ${id}: ${error.message}`);
      throw error;
    }
  }

  @Delete(":id")
  async deletePost(@Param("id") id: string) {
    try {
      await this.postsService.deletePost(id);
      
      return {
        success: true,
        message: "Successfully deleted post",
        data: null,
      };
    } catch (error) {
      this.logger.error(`Failed to delete post ${id}: ${error.message}`);
      throw error;
    }
  }
}
