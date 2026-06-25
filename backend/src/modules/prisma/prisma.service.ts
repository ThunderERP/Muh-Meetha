import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Execute a block within a tenant-scoped transaction.
   * Sets PostgreSQL session variables used by RLS policies for the duration
   * of the transaction only (SET LOCAL — variables reset when tx commits/rolls back).
   *
   *   app.current_tenant_id
   *   app.current_user_id
   *
   * Use this for every write operation and for reads where RLS must be enforced.
   *
   * Usage:
   *   return this.prisma.withTenantContext(tenantId, userId, async (tx) => {
   *     return tx.product.findMany({ where: { tenantId } });
   *   });
   */
  async withTenantContext<T>(
    tenantId: number,
    userId: number,
    fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      // SET LOCAL scopes these to the current transaction — safe with connection pooling.
      await tx.$executeRawUnsafe(
        `SET LOCAL app.current_tenant_id = ${tenantId}`,
      );
      await tx.$executeRawUnsafe(
        `SET LOCAL app.current_user_id = ${userId}`,
      );
      return fn(tx);
    });
  }

  /**
   * Set RLS session context for read-only queries that run outside a transaction.
   * NOTE: Uses SET LOCAL — must be called inside an existing $transaction block.
   * Do NOT call this outside a transaction; the variables will not persist across
   * pooled connection reuse.
   *
   * Prefer withTenantContext() for most cases.
   */
  async setSessionContext(tenantId: number, userId: number): Promise<void> {
    // Two separate statements — $executeRawUnsafe does not support semicolon batching
    // reliably across all Prisma versions.
    await this.$executeRawUnsafe(
      `SET LOCAL app.current_tenant_id = ${tenantId}`,
    );
    await this.$executeRawUnsafe(
      `SET LOCAL app.current_user_id = ${userId}`,
    );
  }
}
