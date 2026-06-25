export declare class CreateUserDto {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    jobTitle?: string;
}
export declare class UpdateUserDto {
    name?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    password?: string;
    currentPassword?: string;
}
declare const UpdateMeDto_base: import("@nestjs/common").Type<Partial<UpdateUserDto>>;
export declare class UpdateMeDto extends UpdateMeDto_base {
}
export {};
