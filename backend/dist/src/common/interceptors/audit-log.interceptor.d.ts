import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../modules/prisma/prisma.service';
export declare const AUDIT_KEY = "auditLog";
export interface AuditMeta {
    action: string;
    module: string;
    entityType: string;
    getEntityId?: (body: unknown, result: unknown) => number | undefined;
}
export declare const AuditLog: (meta: AuditMeta) => (target: object, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare class AuditLogInterceptor implements NestInterceptor {
    private readonly prisma;
    private readonly reflector;
    private readonly logger;
    constructor(prisma: PrismaService, reflector: Reflector);
    intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown>;
}
