import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserRepository } from './users.repository';
@Module({
  exports: [UsersService],
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
})
export class UsersModule {}
