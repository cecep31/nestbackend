import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user object, the JWT guard didn't authenticate the user
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // If user exists but doesn't have is_super_admin property
    if (typeof user.is_super_admin !== 'boolean') {
      throw new ForbiddenException('Invalid user permissions');
    }

    // If user is not a super admin
    if (!user.is_super_admin) {
      throw new ForbiddenException('Super admin privileges required');
    }

    // User is authenticated and is a super admin
    return true;
  }
}
