import { Controller, Get, Req } from '@nestjs/common';
import { MeService } from './me.service';
import { TagsService } from '../tags/tags.service';
import { UsersService } from '../users/users.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('me')
@UseGuards(AuthGuard('jwt'))
export class MeController {
  constructor(
    private readonly meService: MeService,
    private tagService: TagsService,
    private userService: UsersService,
  ) {}

  @Get('posts')
  findPosts() {
    return this.meService.findAll();
  }

  @Get('tags')
  findTags() {
    return this.tagService.getAllTags();
  }

  @Get('profile')
  findProfile(@Req() req: any) {
    const user = this.userService.getUserProfile(req.user.id);
    return {
      success: true,
      message: 'User profile fetched successfully',
      data: user,
    };
  }
}
