export declare class CreateProductDto {
    name: string;
    sku?: string;
    barcode?: string;
    category?: string;
    subcategory?: string;
    brand?: string;
    unit: string;
    hsn?: string;
    price: number;
    purchasePrice?: number;
    gstPercentage?: number;
    discountPercentage?: number;
    description?: string;
    expiryDate?: string;
    manufacturingDate?: string;
    imageUrl?: string;
    reorderLevel?: number;
}
declare const UpdateProductDto_base: import("@nestjs/common").Type<Partial<CreateProductDto>>;
export declare class UpdateProductDto extends UpdateProductDto_base {
}
export declare class ProductFiltersDto {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export {};
