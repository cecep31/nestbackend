import { Global, MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UsersModule } from "./api/users/users.module";
import { AuthModule } from "./api/auth/auth.module";
import { PostsModule } from "./api/posts/posts.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PagesModule } from "./api/note/pages/pages.module";
import { WorkspacesModule } from "./api/note/workspaces/workspaces.module";
import configuration from "./config/configuration";
import { PrismaService } from "./prisma.service";
import { LoggerMiddleware } from "./common/logger/logger.middleware";
import { TagsModule } from "./api/tags/tags.module";
import { WriterModule } from "./api/writer/writer.module";
import { ChatModule } from "./api/chat/chat.module";
import { HoldingsModule } from "./api/holdings/holdings.module";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { BigIntInterceptor } from "./common/interceptors/big-int.interceptor";
import { createObserveModule } from "@nestjs/observe";

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Global()
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
    TagsModule,
    WriterModule,
    ChatModule,
    HoldingsModule,
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY,
      appSecret: process.env.OBSERVE_APP_SECRET,
      serviceId: "nest-backend",
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: BigIntInterceptor,
    },
  ],
  exports: [PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
