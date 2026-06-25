import {
  createParamDecorator, ExecutionContext,
  Injectable, CanActivate, SetMetadata,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { RequestUser } from '../../modules/auth/auth.types';

// ─── @CurrentUser() param decorator ──────────────────────────────────────────

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as RequestUser;
  },
);

// ─── JWT Auth Guard (global default) ─────────────────────────────────────────

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// ─── @Roles() decorator ───────────────────────────────────────────────────────

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// ─── Roles Guard ──────────────────────────────────────────────────────────────

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = ctx.switchToHttp().getRequest<{ user: RequestUser }>();
    if (!user) throw new ForbiddenException('Unauthorized');

    // DEVELOPER_ADMIN bypasses all role checks
    if (user.role === 'DEVELOPER_ADMIN') return true;

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `This action requires one of: ${requiredRoles.join(', ')}`,
      );
    }
    return true;
  }
}

// ─── Public route skip marker ─────────────────────────────────────────────────

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// ─── Combined Guard: skip public routes, then JWT, then Roles ─────────────────

@Injectable()
export class AppAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(ctx: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(ctx);
  }
}
