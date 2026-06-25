export declare class LoginTenantDto {
    tenantSlug: string;
    email: string;
    password: string;
}
export declare class RegisterTenantDto {
    companyName: string;
    slug: string;
    phone?: string;
    email?: string;
    gstin?: string;
    industry?: string;
    website?: string;
    adminName: string;
    adminEmail: string;
    password: string;
    jobTitle?: string;
    tosAccepted: boolean;
    privacyAccepted: boolean;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
