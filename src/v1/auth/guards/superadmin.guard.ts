import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log(user);

    if (!user || typeof user.is_super_admin !== 'boolean') {
      throw new ForbiddenException('User information is missing or invalid.');
    }
    console.log(user);

    if (user.is_super_admin) {
      return true;
    } else {
      throw new ForbiddenException(
        'Access denied: Super admin privileges required.',
      );
    }
  }
}
