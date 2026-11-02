import type { Category, CategoryRow } from '../types/category.types.js';
import type { Draft, DraftPayload, DraftRow } from '../types/draft.types.js';
import type { Transaction, TransactionRow } from '../types/transaction.types.js';
import type { User, UserRow } from '../types/user.types.js';

const toNumber = (value: string | number): number => Number(value);

const toDateString = (value: Date | string): string => {
    if (typeof value === 'string') {
        return value.slice(0, 10);
    }
    return value.toISOString().slice(0, 10);
};

export const mapUserRow = (row: UserRow): User => ({
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

export const mapCategoryRow = (row: CategoryRow): Category => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

export const mapTransactionRow = (row: TransactionRow): Transaction => ({
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    type: row.type,
    amount: toNumber(row.amount),
    date: toDateString(row.date),
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const parsePayload = (payload: DraftPayload | string): DraftPayload => {
    if (typeof payload === 'string') {
        return JSON.parse(payload) as DraftPayload;
    }
    return payload;
};

export const mapDraftRow = (row: DraftRow): Draft => ({
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    status: row.status,
    payload: parsePayload(row.payload),
    source: row.source,
    confirmedAt: row.confirmed_at,
    rejectedAt: row.rejected_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});
