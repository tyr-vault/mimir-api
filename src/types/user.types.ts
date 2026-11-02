export interface AuthUser {
    id: string;
    email: string;
    name: string;
}

export interface User extends AuthUser {
    createdAt: Date;
    updatedAt: Date;
}

export interface UserRow {
    id: string;
    email: string;
    password: string;
    name: string;
    created_at: Date;
    updated_at: Date;
}

export interface CreateUserInput {
    email: string;
    password: string;
    name: string;
}
