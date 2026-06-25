import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class UploadsService {
    private readonly prisma;
    private readonly config;
    private readonly logger;
    private readonly driver;
    private readonly localPath;
    private readonly appUrl;
    private readonly bucket;
    private readonly region;
    constructor(prisma: PrismaService, config: ConfigService);
    uploadFile(tenantId: number, userId: number, file: Express.Multer.File, entityType: string, entityId: number, fieldName: string): Promise<{
        storageKey: string;
        fileId: number;
    }>;
    getSignedUrl(tenantId: number, storageKey: string): Promise<string>;
    serveLocalFile(tenantId: number, encodedKey: string): Promise<{
        buffer: Buffer;
        mimeType: string;
    }>;
    private uploadToLocal;
    private uploadToS3;
    private getS3SignedUrl;
    private getLocalFileUrl;
}
import { Response } from 'express';
import { RequestUser } from '../auth/auth.types';
declare class UploadMetaDto {
    entityType: string;
    entityId: number;
    fieldName: string;
}
export declare class UploadsController {
    private readonly uploadsService;
    constructor(uploadsService: UploadsService);
    upload(file: Express.Multer.File, meta: UploadMetaDto, u: RequestUser): Promise<{
        storageKey: string;
        fileId: number;
    }>;
    getSignedUrl(key: string, u: RequestUser): Promise<{
        url: string;
    }>;
    serveLocal(encodedKey: string, u: RequestUser, res: Response): Promise<void>;
}
export declare class UploadsModule {
}
export {};
