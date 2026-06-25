export declare class PaginationDto {
    page?: number;
    limit?: number;
}
export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
export declare function paginate<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T>;
export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    message?: string;
}
export declare function success<T>(data: T, message?: string): ApiSuccessResponse<T>;
export declare class SearchPaginationDto extends PaginationDto {
    search?: string;
}
