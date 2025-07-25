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
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { LoginDto, loginSchema } from './schemas/loogin-schema';
import { RegisterDto, registerSchema } from './schemas/register-schema';
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
  async register(@Body(new ZodValidationPipe(registerSchema)) registerDto: RegisterDto) {
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
      message: 'success',
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
      maxAge: 4 * 60 * 60 * 1000,
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      domain: '.pilput.me',
    });

    // You can customize the redirect or response as needed:
    // For API: return JWT and user info
    res.redirect('https://pilput.me');
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh-token')
  refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user);
  }
}
