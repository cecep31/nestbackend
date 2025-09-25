import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { PostsService } from "../posts.service";
import { SuperAdminGuard } from "../../auth/guards/superadmin.guard";

@Controller({
  version: "1",
  path: "admin/posts",
})
@UseGuards(SuperAdminGuard)
export class AdminPostsController {
  constructor(private postsService: PostsService) {}

  @Get()
  async findAll(
    @Query("offset") offset: number = 0,
    @Query("limit") limit: number = 10,
    @Query("published") published?: boolean
  ) {
    const { metadata, postsData } = await this.postsService.posts({
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

  @Get(":id")
  async getPost(@Param("id") id: string) {
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
  }

  @Patch(":id/publish")
  async updatePublishPost(
    @Param("id") id: string,
    @Query("published") published: boolean = true
  ) {
    return {
      success: true,
      message: "Successfully updated post publish status",
      data: await this.postsService.updatePublishPost(id, published),
    };
  }

  @Delete(":id")
  async deletePost(@Param("id") id: string) {
    return {
      success: true,
      message: "Successfully deleted post",
      data: await this.postsService.deletePost(id),
    };
  }
}
