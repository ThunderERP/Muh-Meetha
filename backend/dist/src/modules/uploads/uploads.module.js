"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UploadsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsModule = exports.UploadsController = exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_ENTITY_TYPES = ['PRODUCT', 'SUPPLIER', 'USER', 'COMPANY'];
let UploadsService = UploadsService_1 = class UploadsService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.logger = new common_1.Logger(UploadsService_1.name);
        this.driver = config.get('STORAGE_DRIVER', 'local');
        this.localPath = config.get('LOCAL_UPLOAD_PATH', './uploads');
        this.appUrl = config.get('APP_URL', 'http://localhost:3001');
        this.bucket = config.get('AWS_S3_BUCKET', 'thundererp-uploads');
        this.region = config.get('AWS_REGION', 'ap-south-1');
        if (this.driver === 'local' && !fs.existsSync(this.localPath)) {
            fs.mkdirSync(this.localPath, { recursive: true });
        }
    }
    async uploadFile(tenantId, userId, file, entityType, entityId, fieldName) {
        if (!ALLOWED_ENTITY_TYPES.includes(entityType)) {
            throw new common_1.BadRequestException(`Invalid entityType "${entityType}". Allowed: ${ALLOWED_ENTITY_TYPES.join(', ')}`);
        }
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`File type "${file.mimetype}" not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
        }
        if (file.size > MAX_SIZE_BYTES) {
            throw new common_1.BadRequestException('File too large. Maximum size is 5 MB.');
        }
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        const storageKey = `${tenantId}/${entityType}/${entityId}/${fieldName}-${crypto.randomBytes(8).toString('hex')}${ext}`;
        if (this.driver === 's3') {
            await this.uploadToS3(file.buffer, storageKey, file.mimetype);
        }
        else {
            await this.uploadToLocal(file.buffer, storageKey);
        }
        const record = await this.prisma.fileRecord.create({
            data: {
                tenantId,
                entityType: entityType,
                entityId,
                fieldName,
                originalName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                storageKey,
                url: '',
                driver: this.driver,
                uploadedBy: userId,
            },
        });
        return { storageKey, fileId: record.id };
    }
    async getSignedUrl(tenantId, storageKey) {
        if (!storageKey.startsWith(`${tenantId}/`)) {
            throw new common_1.BadRequestException('Access denied to this resource');
        }
        if (this.driver === 's3') {
            return this.getS3SignedUrl(storageKey);
        }
        return this.getLocalFileUrl(storageKey);
    }
    async serveLocalFile(tenantId, encodedKey) {
        const key = decodeURIComponent(encodedKey);
        const fullPath = path.resolve(path.join(this.localPath, key));
        const tenantRoot = path.resolve(path.join(this.localPath, `${tenantId}`));
        if (!fullPath.startsWith(tenantRoot + path.sep)) {
            throw new common_1.BadRequestException('Access denied to this resource');
        }
        if (!fs.existsSync(fullPath)) {
            throw new common_1.BadRequestException('File not found');
        }
        const buffer = fs.readFileSync(fullPath);
        const ext = path.extname(fullPath).toLowerCase();
        const mimeMap = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif',
        };
        return { buffer, mimeType: mimeMap[ext] ?? 'application/octet-stream' };
    }
    async uploadToLocal(buffer, key) {
        const fullPath = path.join(this.localPath, key);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fullPath, buffer);
    }
    async uploadToS3(buffer, key, mimeType) {
        const AWS = await Promise.resolve().then(() => require('aws-sdk'));
        const s3 = new AWS.S3({
            region: this.region,
            accessKeyId: this.config.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY'),
        });
        await s3.putObject({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        }).promise();
    }
    async getS3SignedUrl(key) {
        const AWS = await Promise.resolve().then(() => require('aws-sdk'));
        const s3 = new AWS.S3({
            region: this.region,
            accessKeyId: this.config.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY'),
        });
        return s3.getSignedUrlPromise('getObject', {
            Bucket: this.bucket,
            Key: key,
            Expires: 60 * 15,
        });
    }
    getLocalFileUrl(key) {
        return `${this.appUrl}/api/v1/uploads/local/${encodeURIComponent(key)}`;
    }
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = UploadsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], UploadsService);
const common_2 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_2 = require("@nestjs/swagger");
const auth_decorators_1 = require("../../common/decorators/auth.decorators");
class UploadMetaDto {
}
__decorate([
    (0, swagger_2.ApiProperty)({ enum: ALLOWED_ENTITY_TYPES }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)([...ALLOWED_ENTITY_TYPES]),
    __metadata("design:type", String)
], UploadMetaDto.prototype, "entityType", void 0);
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UploadMetaDto.prototype, "entityId", void 0);
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadMetaDto.prototype, "fieldName", void 0);
let UploadsController = class UploadsController {
    constructor(uploadsService) {
        this.uploadsService = uploadsService;
    }
    upload(file, meta, u) {
        return this.uploadsService.uploadFile(u.tenantId, u.id, file, meta.entityType, Number(meta.entityId), meta.fieldName || 'image');
    }
    async getSignedUrl(key, u) {
        const url = await this.uploadsService.getSignedUrl(u.tenantId, key);
        return { url };
    }
    async serveLocal(encodedKey, u, res) {
        const { buffer, mimeType } = await this.uploadsService.serveLocalFile(u.tenantId, encodedKey);
        res.set('Content-Type', mimeType);
        res.set('Cache-Control', 'private, max-age=900');
        res.send(buffer);
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_2.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Upload a file — returns storageKey, not a public URL' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_2.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 5 * 1024 * 1024 } })),
    __param(0, (0, common_2.UploadedFile)()),
    __param(1, (0, common_2.Body)()),
    __param(2, (0, auth_decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UploadMetaDto, Object]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "upload", null);
__decorate([
    (0, common_2.Get)('signed-url'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a serve URL for a stored file' }),
    (0, swagger_1.ApiQuery)({ name: 'key', description: 'storageKey returned at upload time' }),
    __param(0, (0, common_2.Query)('key')),
    __param(1, (0, auth_decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "getSignedUrl", null);
__decorate([
    (0, common_2.Get)('local/:key'),
    (0, swagger_1.ApiOperation)({ summary: 'Serve a locally stored file (dev/local driver only)' }),
    __param(0, (0, common_2.Param)('key')),
    __param(1, (0, auth_decorators_1.CurrentUser)()),
    __param(2, (0, common_2.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "serveLocal", null);
exports.UploadsController = UploadsController = __decorate([
    (0, swagger_1.ApiTags)('Uploads'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_2.UseGuards)(auth_decorators_1.JwtAuthGuard),
    (0, common_2.Controller)('uploads'),
    __metadata("design:paramtypes", [UploadsService])
], UploadsController);
const common_3 = require("@nestjs/common");
const platform_express_2 = require("@nestjs/platform-express");
const multer = require("multer");
let UploadsModule = class UploadsModule {
};
exports.UploadsModule = UploadsModule;
exports.UploadsModule = UploadsModule = __decorate([
    (0, common_3.Module)({
        imports: [
            platform_express_2.MulterModule.register({ storage: multer.memoryStorage() }),
        ],
        controllers: [UploadsController],
        providers: [UploadsService],
        exports: [UploadsService],
    })
], UploadsModule);
//# sourceMappingURL=uploads.module.js.map