import db from '../db/knex.js';
import type { Category, CategoryRow, CreateCategoryInput } from '../types/category.types.js';
import { mapCategoryRow } from '../utils/mappers.js';

const CATEGORIES = 'categories';

export const DEFAULT_CATEGORIES = [
    'Groceries',
    'Housing',
    'Transport',
    'Food',
    'Personal',
    'Health',
    'Income',
    'Other',
] as const;

export const categoryRepository = {
    async findByUserId(userId: string): Promise<Category[]> {
        const rows = await db<CategoryRow>(CATEGORIES)
            .where({ user_id: userId })
            .orderBy('name', 'asc');
        return rows.map(mapCategoryRow);
    },

    async findByIdForUser(id: string, userId: string): Promise<Category | null> {
        const row = await db<CategoryRow>(CATEGORIES).where({ id, user_id: userId }).first();
        return row ? mapCategoryRow(row) : null;
    },

    async findByNameForUser(name: string, userId: string): Promise<Category | null> {
        const row = await db<CategoryRow>(CATEGORIES)
            .where({ user_id: userId })
            .andWhereRaw('LOWER(name) = LOWER(?)', [name.trim()])
            .first();
        return row ? mapCategoryRow(row) : null;
    },

    async create(input: CreateCategoryInput): Promise<Category> {
        const [row] = await db<CategoryRow>(CATEGORIES)
            .insert({
                user_id: input.userId,
                name: input.name.trim(),
            })
            .returning('*');

        if (!row) {
            throw new Error('Failed to create category');
        }

        return mapCategoryRow(row);
    },

    async seedDefaults(userId: string): Promise<Category[]> {
        const rows = await db<CategoryRow>(CATEGORIES)
            .insert(
                DEFAULT_CATEGORIES.map((name) => ({
                    user_id: userId,
                    name,
                })),
            )
            .returning('*');

        return rows.map(mapCategoryRow);
    },
};
