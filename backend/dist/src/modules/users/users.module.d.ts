import { UsersService } from './users.service';
import { CreateUserDto, UpdateMeDto, UpdateUserDto } from './dto/users.dto';
import { SearchPaginationDto } from '../../common/dto/pagination.dto';
import { RequestUser } from '../auth/auth.types';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(user: RequestUser, dto: SearchPaginationDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
        id: number;
        name: string;
        isActive: boolean;
        phone: string | null;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: number;
        role: import(".prisma/client").$Enums.Role;
        jobTitle: string | null;
        avatarUrl: string | null;
    }>>;
    getMe(user: RequestUser): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        phone: string | null;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: number;
        role: import(".prisma/client").$Enums.Role;
        jobTitle: string | null;
        avatarUrl: string | null;
    }>;
    updateMe(user: RequestUser, dto: UpdateMeDto): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        phone: string | null;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: number;
        role: import(".prisma/client").$Enums.Role;
        jobTitle: string | null;
        avatarUrl: string | null;
    }>;
    findOne(id: number, user: RequestUser): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        phone: string | null;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: number;
        role: import(".prisma/client").$Enums.Role;
        jobTitle: string | null;
        avatarUrl: string | null;
    }>;
    create(dto: CreateUserDto, user: RequestUser): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        phone: string | null;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: number;
        role: import(".prisma/client").$Enums.Role;
        jobTitle: string | null;
        avatarUrl: string | null;
    }>;
    update(id: number, user: RequestUser, dto: UpdateUserDto): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        phone: string | null;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: number;
        role: import(".prisma/client").$Enums.Role;
        jobTitle: string | null;
        avatarUrl: string | null;
    }>;
    deactivate(id: number, user: RequestUser): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        phone: string | null;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: number;
        role: import(".prisma/client").$Enums.Role;
        jobTitle: string | null;
        avatarUrl: string | null;
    }>;
    activate(id: number, user: RequestUser): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        phone: string | null;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: number;
        role: import(".prisma/client").$Enums.Role;
        jobTitle: string | null;
        avatarUrl: string | null;
    }>;
}
export declare class UsersModule {
}
