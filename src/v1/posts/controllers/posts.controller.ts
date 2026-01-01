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
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { PostsService } from "../posts.service";
import { SuperAdminGuard } from "../../auth/guards/superadmin.guard";
import { type CreatePostDto, CreatePostSchema } from "../dto/create-post.dto";
import { type UpdatePostDto, updatePostSchema } from "../dto/update-post.dto";
import { LikePostDto, LikePostSchema } from "../dto/like-post.dto";
import { BookmarkPostDto, BookmarkPostSchema } from "../dto/bookmark-post.dto";
import { type RecordViewDto, RecordViewSchema } from "../dto/record-view.dto";
import {
  type PatchPostDto,
  PatchPostSchema,
} from "../dto/patch-post.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";

@Controller({
  version: "1",
  path: "posts",
})
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get()
  async findAll(
    @Query("offset") offset: number = 0,
    @Query("limit") limit: number = 10
  ) {
    const { metadata, postsData } = await this.postsService.findAllPosts({
      offset,
      limit,
    });
    return {
      success: true,
      message: "Successfully fetched posts",
      data: postsData,
      meta: metadata,
    };
  }

  @Get("u/:username/:slug")
  async getByUsernameAndSlug(
    @Param("username") username: string,
    @Param("slug") slug: string
  ) {
    return {
      success: true,
      message: "Successfully fetched post",
      data: await this.postsService.getByUsernameAndSlug(username, slug),
    };
  }

  @Get("/random")
  async getPostRandom(@Query("limit") limit: number = 9) {
    return {
      success: true,
      message: "Successfully fetched random posts",
      data: await this.postsService.getPostRandom(limit),
    };
  }
  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getPostsByCreator(
    @Request() req,
    @Query("offset") offset: number = 0,
    @Query("limit") limit: number = 10
  ) {
    const { metadata, postsData } = await this.postsService.getPostsByCreator(
      req.user.user_id,
      offset,
      limit
    );
    return {
      success: true,
      message: "Successfully fetched posts",
      data: postsData,
      meta: metadata,
    };
  }

  @Get(":id")
  async post(@Param("id") id: string) {
    const post = await this.postsService.findById(id);
    if (!post) {
      return {
        success: false,
        message: "Post not found",
        data: [],
      };
    }
    return {
      success: true,
      message: "Successfully fetched post",
      data: post,
    };
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Delete(":id")
  async deletePost(@Param("id") id: string) {
    return {
      success: true,
      message: "Successfully deleted post",
      data: await this.postsService.deletePost(id),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor("image"))
  async createPost(
    @Body(new ZodValidationPipe(CreatePostSchema))
    createPostDto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    return {
      success: true,
      message: "Successfully created post",
      data: await this.postsService.createPost(
        createPostDto,
        req.user.user_id,
        file
      ),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  async updatePost(
    @Body(new ZodValidationPipe(updatePostSchema)) updatePostDto: UpdatePostDto,
    @Request() req
  ) {
    return {
      success: true,
      message: "Successfully updated post",
      data: await this.postsService.updatePost(updatePostDto, req.user.user_id),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch("/:id")
  async patchPost(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(PatchPostSchema))
    patchPostDto: PatchPostDto,
    @Request() req
  ) {
    return {
      success: true,
      message: "Successfully updated post",
      data: await this.postsService.patchPost(
        id,
        patchPostDto,
        req.user.user_id
      ),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("like")
  async likePost(
    @Body(new ZodValidationPipe(LikePostSchema)) likePostDto: LikePostDto,
    @Request() req
  ) {
    return {
      success: true,
      message: "Successfully liked post",
      data: await this.postsService.likePost(likePostDto, req.user.user_id),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete("like/:id")
  @HttpCode(HttpStatus.OK)
  async unlikePost(@Param("id") id: string, @Request() req) {
    return {
      success: true,
      message: "Successfully unliked post",
      data: await this.postsService.unlikePost(id, req.user.user_id),
    };
  }

  @Get(":id/likes")
  async getPostLikes(@Param("id") id: string) {
    return {
      success: true,
      message: "Successfully fetched post likes",
      data: await this.postsService.getPostLikes(id),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id/liked")
  async checkUserLiked(@Param("id") id: string, @Request() req) {
    return {
      success: true,
      message: "Successfully checked if user liked post",
      data: await this.postsService.checkUserLiked(id, req.user.user_id),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("bookmark")
  async bookmarkPost(
    @Body(new ZodValidationPipe(BookmarkPostSchema))
    bookmarkPostDto: BookmarkPostDto,
    @Request() req
  ) {
    return {
      success: true,
      message: "Successfully bookmarked post",
      data: await this.postsService.bookmarkPost(
        bookmarkPostDto,
        req.user.user_id
      ),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete("bookmark/:id")
  @HttpCode(HttpStatus.OK)
  async unbookmarkPost(@Param("id") id: string, @Request() req) {
    return {
      success: true,
      message: "Successfully unbookmarked post",
      data: await this.postsService.unbookmarkPost(id, req.user.user_id),
    };
  }

  @Get(":id/bookmarks")
  async getPostBookmarks(@Param("id") id: string) {
    return {
      success: true,
      message: "Successfully fetched post bookmarks",
      data: await this.postsService.getPostBookmarks(id),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id/bookmarked")
  async checkUserBookmarked(@Param("id") id: string, @Request() req) {
    return {
      success: true,
      message: "Successfully checked if user bookmarked post",
      data: await this.postsService.checkUserBookmarked(id, req.user.user_id),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("bookmarks")
  async getUserBookmarks(
    @Request() req,
    @Query("offset") offset: number = 0,
    @Query("limit") limit: number = 10
  ) {
    const { metadata, postsData } = await this.postsService.getUserBookmarks(
      req.user.user_id,
      offset,
      limit
    );
    return {
      success: true,
      message: "Successfully fetched user bookmarks",
      data: postsData,
      meta: metadata,
    };
  }

  @Post("view")
  async recordView(
    @Body(new ZodValidationPipe(RecordViewSchema))
    recordViewDto: RecordViewDto,
    @Request() req
  ) {
    // Get user_id if authenticated
    const user_id = req.user?.user_id;

    // Populate optional fields from request
    const enrichedDto: RecordViewDto = {
      ...recordViewDto,
      ip_address: recordViewDto.ip_address || req.ip || req.connection?.remoteAddress,
      user_agent: recordViewDto.user_agent || req.get('User-Agent'),
    };

    return {
      success: true,
      message: "Successfully recorded view",
      data: await this.postsService.recordView(enrichedDto, user_id),
    };
  }

  @Get(":id/views")
  async getPostViews(@Param("id") id: string) {
    return {
      success: true,
      message: "Successfully fetched post views",
      data: await this.postsService.getPostViews(id),
    };
  }
}
