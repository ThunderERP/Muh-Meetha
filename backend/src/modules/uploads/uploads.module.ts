// ─── uploads.service.ts ───────────────────────────────────────────────────────

import {
  Injectable, BadRequestException, Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Whitelist of valid entityType values.
 * The previous code accepted any free-form string, which allowed partial
 * path-traversal in the S3 key and uncontrolled directory creation locally.
 */
const ALLOWED_ENTITY_TYPES = ['PRODUCT', 'SUPPLIER', 'USER', 'COMPANY'] as const;
type AllowedEntityType = typeof ALLOWED_ENTITY_TYPES[number];

@Injectable()
export class UploadsService {
  private readonly logger    = new Logger(UploadsService.name);
  private readonly driver:   string;
  private readonly localPath: string;
  private readonly appUrl:   string;
  private readonly bucket:   string;
  private readonly region:   string;

  constructor(
    private readonly prisma:  PrismaService,
    private readonly config:  ConfigService,
  ) {
    this.driver    = config.get('STORAGE_DRIVER', 'local');
    this.localPath = config.get('LOCAL_UPLOAD_PATH', './uploads');
    this.appUrl    = config.get('APP_URL', 'http://localhost:3001');
    this.bucket    = config.get('AWS_S3_BUCKET', 'thundererp-uploads');
    this.region    = config.get('AWS_REGION', 'ap-south-1');

    if (this.driver === 'local' && !fs.existsSync(this.localPath)) {
      fs.mkdirSync(this.localPath, { recursive: true });
    }
  }

  async uploadFile(
    tenantId:   number,
    userId:     number,
    file:       Express.Multer.File,
    entityType: string,
    entityId:   number,
    fieldName:  string,
  ) {
    // ── Validate entity type against whitelist ────────────────────────────────
    if (!(ALLOWED_ENTITY_TYPES as readonly string[]).includes(entityType)) {
      throw new BadRequestException(
        `Invalid entityType "${entityType}". Allowed: ${ALLOWED_ENTITY_TYPES.join(', ')}`,
      );
    }

    // ── Validate file ─────────────────────────────────────────────────────────
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type "${file.mimetype}" not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException('File too large. Maximum size is 5 MB.');
    }

    const ext        = path.extname(file.originalname).toLowerCase() || '.jpg';
    const storageKey = `${tenantId}/${entityType}/${entityId}/${fieldName}-${crypto.randomBytes(8).toString('hex')}${ext}`;

    if (this.driver === 's3') {
      await this.uploadToS3(file.buffer, storageKey, file.mimetype);
    } else {
      await this.uploadToLocal(file.buffer, storageKey);
    }

    // ── Persist file record (storageKey only — no public URL stored) ──────────
    const record = await this.prisma.fileRecord.create({
      data: {
        tenantId,
        entityType:   entityType as AllowedEntityType,
        entityId,
        fieldName,
        originalName: file.originalname,
        mimeType:     file.mimetype,
        sizeBytes:    file.size,
        storageKey,
        url:          '',
        driver:       this.driver,
        uploadedBy:   userId,
      },
    });

    // Return storageKey — callers persist this and call getSignedUrl() to render
    return { storageKey, fileId: record.id };
  }

  /**
   * Return a URL that serves the file for the current tenant.
   * S3:    AWS pre-signed GET URL (15-min TTL).
   * Local: JWT-protected endpoint on this server — no extra token needed.
   *
   * @param tenantId   — verifies the storageKey belongs to this tenant
   * @param storageKey — the key returned at upload time
   */
  async getSignedUrl(tenantId: number, storageKey: string): Promise<string> {
    // Security: key must be scoped to this tenant (prefix = "<tenantId>/")
    if (!storageKey.startsWith(`${tenantId}/`)) {
      throw new BadRequestException('Access denied to this resource');
    }

    if (this.driver === 's3') {
      return this.getS3SignedUrl(storageKey);
    }
    return this.getLocalFileUrl(storageKey);
  }

  /**
   * Serve a locally stored file. Called by GET /uploads/local/:key.
   * The key is URL-encoded so path separators survive NestJS routing.
   */
  async serveLocalFile(
    tenantId:   number,
    encodedKey: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const key      = decodeURIComponent(encodedKey);
    const fullPath = path.resolve(path.join(this.localPath, key));

    // Prevent path traversal — resolved path must still be inside localPath/<tenantId>/
    const tenantRoot = path.resolve(path.join(this.localPath, `${tenantId}`));
    if (!fullPath.startsWith(tenantRoot + path.sep)) {
      throw new BadRequestException('Access denied to this resource');
    }

    if (!fs.existsSync(fullPath)) {
      throw new BadRequestException('File not found');
    }

    const buffer = fs.readFileSync(fullPath);
    const ext    = path.extname(fullPath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg':  'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png':  'image/png',
      '.webp': 'image/webp',
      '.gif':  'image/gif',
    };

    return { buffer, mimeType: mimeMap[ext] ?? 'application/octet-stream' };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async uploadToLocal(buffer: Buffer, key: string): Promise<void> {
    const fullPath = path.join(this.localPath, key);
    const dir      = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, buffer);
  }

  private async uploadToS3(buffer: Buffer, key: string, mimeType: string): Promise<void> {
    const AWS = await import('aws-sdk');
    const s3  = new AWS.S3({
      region:          this.region,
      accessKeyId:     this.config.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY'),
    });

    // No ACL — defaults to bucket policy. Ensure bucket has "Block all public access" ON.
    await s3.putObject({
      Bucket:      this.bucket,
      Key:         key,
      Body:        buffer,
      ContentType: mimeType,
    }).promise();
  }

  private async getS3SignedUrl(key: string): Promise<string> {
    const AWS = await import('aws-sdk');
    const s3  = new AWS.S3({
      region:          this.region,
      accessKeyId:     this.config.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY'),
    });

    return s3.getSignedUrlPromise('getObject', {
      Bucket:  this.bucket,
      Key:     key,
      Expires: 60 * 15, // 15 minutes
    });
  }

  private getLocalFileUrl(key: string): string {
    // JWT on the endpoint is the only auth needed for local/dev.
    // encodeURIComponent converts "/" in the key to "%2F" so it
    // arrives as a single :key param and doesn't confuse the router.
    return `${this.appUrl}/api/v1/uploads/local/${encodeURIComponent(key)}`;
  }
}

// ─── uploads.controller.ts ────────────────────────────────────────────────────

import {
  Controller, Post, Get, Param, Res,
  UseInterceptors, UploadedFile,
  UseGuards, Body, Query,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsString, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  JwtAuthGuard, CurrentUser,
} from '../../common/decorators/auth.decorators';
import { RequestUser } from '../auth/auth.types';

class UploadMetaDto {
  @ApiProperty({ enum: ALLOWED_ENTITY_TYPES })
  @IsString()
  @IsIn(ALLOWED_ENTITY_TYPES)
  entityType: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  entityId: number;

  @ApiProperty()
  @IsString()
  fieldName: string;
}

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * POST /uploads
   * Upload a file. Returns { storageKey, fileId }.
   * Persist storageKey on your entity. Use GET /uploads/signed-url to render it.
   */
  @Post()
  @ApiOperation({ summary: 'Upload a file — returns storageKey, not a public URL' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() meta: UploadMetaDto,
    @CurrentUser() u: RequestUser,
  ) {
    return this.uploadsService.uploadFile(
      u.tenantId,
      u.id,
      file,
      meta.entityType,
      Number(meta.entityId),
      meta.fieldName || 'image',
    );
  }

  /**
   * GET /uploads/signed-url?key=<storageKey>
   * S3:    returns a 15-min pre-signed AWS URL.
   * Local: returns a URL to GET /uploads/local/:key (JWT-protected).
   */
  @Get('signed-url')
  @ApiOperation({ summary: 'Get a serve URL for a stored file' })
  @ApiQuery({ name: 'key', description: 'storageKey returned at upload time' })
  async getSignedUrl(
    @Query('key') key: string,
    @CurrentUser() u: RequestUser,
  ) {
    const url = await this.uploadsService.getSignedUrl(u.tenantId, key);
    return { url };
  }

  /**
   * GET /uploads/local/:key
   * Serves a locally stored file. The :key param is URL-encoded (slashes → %2F).
   * Protected by JwtAuthGuard — only authenticated users of the correct tenant
   * can retrieve files (ownership enforced in serveLocalFile by prefix check).
   *
   * Only active when STORAGE_DRIVER=local (development / testing).
   */
  @Get('local/:key')
  @ApiOperation({ summary: 'Serve a locally stored file (dev/local driver only)' })
  async serveLocal(
    @Param('key') encodedKey: string,
    @CurrentUser() u: RequestUser,
    @Res() res: Response,
  ) {
    const { buffer, mimeType } = await this.uploadsService.serveLocalFile(u.tenantId, encodedKey);
    res.set('Content-Type', mimeType);
    res.set('Cache-Control', 'private, max-age=900'); // 15 min browser cache
    res.send(buffer);
  }
}

// ─── uploads.module.ts ────────────────────────────────────────────────────────

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';

@Module({
  imports: [
    MulterModule.register({ storage: multer.memoryStorage() }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
