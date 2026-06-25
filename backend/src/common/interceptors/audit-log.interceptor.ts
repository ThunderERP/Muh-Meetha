import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { RequestUser } from '../../modules/auth/auth.types';

export const AUDIT_KEY = 'auditLog';

export interface AuditMeta {
  action: string;
  module: string;
  entityType: string;
  getEntityId?: (body: unknown, result: unknown) => number | undefined;
}

export const AuditLog = (meta: AuditMeta) =>
  (target: object, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(AUDIT_KEY, meta, descriptor.value);
    return descriptor;
  };

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditMeta>(AUDIT_KEY, ctx.getHandler());
    if (!meta) return next.handle();

    const req    = ctx.switchToHttp().getRequest();
    const user   = req.user as RequestUser | undefined;
    if (!user) return next.handle();

    const before = req.body;

    return next.handle().pipe(
      tap(async (result) => {
        try {
          const entityId = meta.getEntityId
            ? meta.getEntityId(before, result)
            : undefined;

          await this.prisma.auditLog.create({
            data: {
              tenantId:   user.tenantId,
              userId:     user.id,
              action:     meta.action as any,
              module:     meta.module,
              entityType: meta.entityType,
              entityId:   entityId ?? null,
              before:     before ?? undefined,
              after:      result   ?? undefined,
              ipAddress:  req.ip,
              userAgent:  req.headers['user-agent'],
              requestId:  req.requestId,
            },
          });
        } catch (err) {
          this.logger.error('Audit log write failed', err);
        }
      }),
    );
  }
}
