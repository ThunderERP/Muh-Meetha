import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Decode JWT without verifying — only used to pre-populate req.jwtPayload
// for convenience. The real security check happens in JwtStrategy (auth guard).
// We avoid injecting JwtService here to prevent circular-dependency issues
// between AppModule middleware registration and AuthModule.
function jwtDecode(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const payload = jwtDecode(authHeader.slice(7));
      if (payload) {
        (req as any).jwtPayload = payload;
      }
    }
    next();
  }
}
