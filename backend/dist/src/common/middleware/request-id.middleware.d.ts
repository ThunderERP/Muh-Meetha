import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            requestId: string;
        }
    }
}
export declare class RequestIdMiddleware implements NestMiddleware {
    use(req: Request, _res: Response, next: NextFunction): void;
}
