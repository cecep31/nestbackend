import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { DbModule } from 'src/db/db.module';

@Module({
  imports: [
    PassportModule,
    DbModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt_secret'),
        signOptions: { expiresIn: '6h' },
      }),
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, GithubStrategy],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
