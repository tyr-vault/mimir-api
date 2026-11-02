import type { TransactionType } from './transaction.types.js';

export type DraftKind = 'transaction' | 'category';
export type DraftStatus = 'pending' | 'confirmed' | 'rejected';

export interface TransactionDraftPayload {
    /** Set when the category already exists. Optional if `categoryName` is provided. */
    categoryId?: string;
    /** Pending / new category name; applied on confirm when id is missing. */
    categoryName?: string;
    type: TransactionType;
    amount: number;
    date: string;
    note?: string | null;
}

export interface CategoryDraftPayload {
    name: string;
}

export type DraftPayload = TransactionDraftPayload | CategoryDraftPayload;

export interface Draft {
    id: string;
    userId: string;
    kind: DraftKind;
    status: DraftStatus;
    payload: DraftPayload;
    source: string;
    confirmedAt: Date | null;
    rejectedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface DraftRow {
    id: string;
    user_id: string;
    kind: DraftKind;
    status: DraftStatus;
    payload: DraftPayload | string;
    source: string;
    confirmed_at: Date | null;
    rejected_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

export interface CreateDraftInput {
    userId: string;
    kind: DraftKind;
    payload: DraftPayload;
    source?: string;
}

export interface UpdateDraftInput {
    payload: DraftPayload;
}
