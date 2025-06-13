import { Module } from '@nestjs/common';
import { MeService } from './me.service';
import { MeController } from './me.controller';
import { PostsModule } from '../posts/posts.module';
import { PostsRepository } from '../posts/posts.repository';
import { TagsService } from '../tags/tags.service';
import { TagsModule } from '../tags/tags.module';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';

@Module({
  controllers: [MeController],
  providers: [MeService, PostsRepository, TagsService, UsersService],
  imports: [PostsModule, TagsModule, UsersModule],
})
export class MeModule { }
