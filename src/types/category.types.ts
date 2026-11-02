export interface Category {
    id: string;
    userId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CategoryRow {
    id: string;
    user_id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
}

export interface CreateCategoryInput {
    userId: string;
    name: string;
}
