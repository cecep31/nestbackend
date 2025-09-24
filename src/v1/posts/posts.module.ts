import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';
import { PostsGateway } from './posts.gateway';
import { UserSocketMapService } from './user-map-service';
import { AuthModule } from '../auth/auth.module';
import { MinioModule } from '../../common/s3/minio.module';

@Module({
  imports: [AuthModule, MinioModule],
  controllers: [PostsController],
  providers: [
    PostsService,
    PostsRepository,
    PostsGateway,
    UserSocketMapService,
  ],
  exports: [PostsService, PostsRepository],
})
export class PostsModule {}
