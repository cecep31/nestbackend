import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { OpenRouterService } from '../../common/ai/openrouter.service';
import { ChatController } from './chat.controller';
import { ChatService } from './services/chat.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 1000, // 1 second
        limit: 5,
      },
      {
        ttl: 10000, // 10 seconds
        limit: 20,
      },
      {
        ttl: 60000, // 1 minute
        limit: 100,
      },
    ]),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: 30000, // 30 seconds
        maxRedirects: 5,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, OpenRouterService],
  exports: [ChatService],
})
export class ChatModule {}
