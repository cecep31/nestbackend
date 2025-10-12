import {
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Body,
  Req,
  Res,
  HttpStatus,
  HttpCode,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { LoginDto } from './dto/loogin-schema';
import { loginSchema } from './dto/loogin-schema';
import type { RegisterDto } from './dto/register-schema';
import { registerSchema } from './dto/register-schema';
import type { CheckUsernameDto } from './dto/check-username-schema';
import { checkUsernameSchema } from './dto/check-username-schema';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ZodValidationPipe(registerSchema)) registerDto: RegisterDto,
  ) {
    try {
      const data = await this.authService.register(
        registerDto.username,
        registerDto.email,
        registerDto.password,
      );
      return {
        data,
        success: true,
        message: 'User registered successfully',
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @HttpCode(HttpStatus.OK)
  async signIn(@Body(new ZodValidationPipe(loginSchema)) loginDto: LoginDto) {
    const data = await this.authService.signIn(
      loginDto.email,
      loginDto.password,
    );
    if (!data) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid credentials',
      });
    }
    return {
      data,
      success: true,
      message: 'Login successful',
    };
  }

  @Post('check-username')
  @HttpCode(HttpStatus.OK)
  async checkUsername(
    @Body(new ZodValidationPipe(checkUsernameSchema))
    checkUsernameDto: CheckUsernameDto,
  ) {
    const data = await this.authService.checkUsernameAvailability(
      checkUsernameDto.username,
    );
    return {
      success: true,
      message: 'Username availability checked',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('profile')
  getProfile(@Request() req) {
    return this.authService.profile(req.user);
  }

  // --- GitHub OAuth ---
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    // Redirect handled by Passport
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req, @Res() res) {
    // Successful authentication, issue JWT and return user info
    // req.user is set by GithubStrategy.validate()
    if (!req.user) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ success: false, message: 'GitHub authentication failed' });
    }

    // set cookie
    res.cookie('token', req.user.access_token, {
      maxAge: 6 * 60 * 60 * 1000, // 6 hours
      httpOnly: false,
      secure: true,
      sameSite: 'none',
      domain: '.pilput.me',
    });

    // You can customize the redirect or response as needed:
    // For API: return JWT and user info
    res.redirect('https://pilput.me');
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh-token')
  async refreshToken(@Request() req) {
    const data = await this.authService.refreshToken(req.user)
    if (!data) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid credentials',
      });
    }
    return {
      data,
      success: true,
      message: 'Refresh token successful',
    };
  }
}
