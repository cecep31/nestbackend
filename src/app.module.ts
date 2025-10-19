import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UsersModule } from "./v1/users/users.module";
import { AuthModule } from "./v1/auth/auth.module";
import { PostsModule } from "./v1/posts/posts.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PagesModule } from "./v1/note/pages/pages.module";
import { WorkspacesModule } from "./v1/note/workspaces/workspaces.module";
import configuration from "./config/configuration";
import { DbModule } from "./db/db.module";
import { LoggerMiddleware } from "./common/logger/logger.middleware";
import { EmailModule } from "./common/email/email.module";
import { TagsModule } from "./v1/tags/tags.module";
import { WriterModule } from "./v1/writer/writer.module";
import { ChatModule } from "./v1/chat/chat.module";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { BigIntInterceptor } from "./common/interceptors/big-int.interceptor";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>("throttler.ttl", 60),
            limit: config.get<number>("throttler.limit", 10),
          },
        ],
      }),
    }),
    UsersModule,
    AuthModule,
    PostsModule,
    PagesModule,
    WorkspacesModule,
    DbModule,
    EmailModule,
    TagsModule,
    WriterModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: BigIntInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
