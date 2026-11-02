import { categoryRepository } from '../repositories/category.repository.js';
import { DRAFT_AUTO_CONFIRM_DAYS, draftRepository } from '../repositories/draft.repository.js';
import { transactionRepository } from '../repositories/transaction.repository.js';
import type {
    CategoryDraftPayload,
    Draft,
    DraftKind,
    DraftPayload,
    TransactionDraftPayload,
} from '../types/draft.types.js';
import type { TransactionType } from '../types/transaction.types.js';
import { ApiError } from '../utils/ApiError.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isTransactionPayload(payload: DraftPayload): payload is TransactionDraftPayload {
    return 'amount' in payload && ('categoryId' in payload || 'categoryName' in payload);
}

export function isCategoryPayload(payload: DraftPayload): payload is CategoryDraftPayload {
    return 'name' in payload && !('amount' in payload);
}

export function validateTransactionPayload(payload: unknown): TransactionDraftPayload {
    const body = payload as Partial<TransactionDraftPayload>;
    const categoryId = body.categoryId?.trim() || undefined;
    const categoryName = body.categoryName?.trim() || undefined;
    if ((!categoryId && !categoryName) || body.type === undefined || body.amount === undefined || !body.date) {
        throw new ApiError(400, 'categoryId or categoryName, plus type, amount, and date are required');
    }
    if (body.type !== 'expense' && body.type !== 'income') {
        throw new ApiError(400, 'type must be expense or income');
    }
    if (typeof body.amount !== 'number' || Number.isNaN(body.amount) || body.amount <= 0) {
        throw new ApiError(400, 'amount must be a positive number');
    }
    if (typeof body.date !== 'string' || !ISO_DATE.test(body.date)) {
        throw new ApiError(400, 'date must be YYYY-MM-DD');
    }
    return {
        categoryId,
        categoryName,
        type: body.type as TransactionType,
        amount: body.amount,
        date: body.date,
        note: body.note ?? null,
    };
}

export function validateCategoryPayload(payload: unknown): CategoryDraftPayload {
    const body = payload as Partial<CategoryDraftPayload>;
    if (!body.name?.trim()) {
        throw new ApiError(400, 'name is required');
    }
    return { name: body.name.trim() };
}

export function validatePayloadForKind(kind: DraftKind, payload: unknown): DraftPayload {
    if (kind === 'transaction') {
        return validateTransactionPayload(payload);
    }
    return validateCategoryPayload(payload);
}

async function resolveCategoryForTransaction(
    userId: string,
    payload: TransactionDraftPayload,
): Promise<{ id: string; created: boolean }> {
    if (payload.categoryId) {
        const byId = await categoryRepository.findByIdForUser(payload.categoryId, userId);
        if (byId) {
            return { id: byId.id, created: false };
        }
    }

    const name = payload.categoryName?.trim();
    if (!name) {
        throw new ApiError(400, 'categoryId is invalid');
    }

    const existing = await categoryRepository.findByNameForUser(name, userId);
    if (existing) {
        return { id: existing.id, created: false };
    }

    const created = await categoryRepository.create({ userId, name });
    return { id: created.id, created: true };
}

/** Mark pending category drafts with the same name confirmed (used when tx confirm creates/finds the category). */
async function settleMatchingCategoryDrafts(userId: string, categoryName: string): Promise<void> {
    const pending = await draftRepository.list(userId, 'pending');
    const needle = categoryName.trim().toLowerCase();

    for (const draft of pending) {
        if (draft.kind !== 'category' || !isCategoryPayload(draft.payload)) continue;
        if (draft.payload.name.trim().toLowerCase() !== needle) continue;
        await draftRepository.markConfirmed(draft.id, userId);
    }
}

async function applyTransactionDraft(userId: string, payload: TransactionDraftPayload) {
    const { id: categoryId } = await resolveCategoryForTransaction(userId, payload);

    if (payload.categoryName) {
        await settleMatchingCategoryDrafts(userId, payload.categoryName);
    }

    return transactionRepository.create({
        userId,
        categoryId,
        type: payload.type,
        amount: payload.amount,
        date: payload.date,
        note: payload.note ?? null,
    });
}

async function applyCategoryDraft(userId: string, payload: CategoryDraftPayload) {
    try {
        return await categoryRepository.create({
            userId,
            name: payload.name,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('unique') || message.includes('duplicate')) {
            throw new ApiError(409, 'Category already exists');
        }
        throw error;
    }
}

export async function applyDraft(draft: Draft): Promise<unknown> {
    if (draft.kind === 'transaction') {
        if (!isTransactionPayload(draft.payload)) {
            throw new ApiError(400, 'Invalid transaction draft payload');
        }
        return applyTransactionDraft(draft.userId, draft.payload);
    }

    if (!isCategoryPayload(draft.payload)) {
        throw new ApiError(400, 'Invalid category draft payload');
    }
    return applyCategoryDraft(draft.userId, draft.payload);
}

export async function confirmDraft(id: string, userId: string): Promise<{ draft: Draft; result: unknown }> {
    const draft = await draftRepository.findByIdForUser(id, userId);
    if (!draft) {
        throw new ApiError(404, 'Draft not found');
    }
    if (draft.status !== 'pending') {
        throw new ApiError(400, `Draft is already ${draft.status}`);
    }

    const result = await applyDraft(draft);
    const confirmed = await draftRepository.markConfirmed(id, userId);
    if (!confirmed) {
        throw new ApiError(409, 'Draft could not be confirmed');
    }

    return { draft: confirmed, result };
}

export async function confirmExpiredDrafts(userId: string): Promise<number> {
    const expired = await draftRepository.listExpiredPending(userId, DRAFT_AUTO_CONFIRM_DAYS);
    // Categories first so transaction drafts can resolve categoryName.
    const ordered = [
        ...expired.filter((d) => d.kind === 'category'),
        ...expired.filter((d) => d.kind !== 'category'),
    ];
    let confirmed = 0;

    for (const draft of ordered) {
        try {
            // May already be settled when a linked transaction confirm created the category.
            const current = await draftRepository.findByIdForUser(draft.id, userId);
            if (!current || current.status !== 'pending') continue;

            await applyDraft(current);
            const ok = await draftRepository.markConfirmed(current.id, userId);
            if (ok) confirmed += 1;
        } catch (error) {
            console.error(`[drafts] auto-confirm failed for ${draft.id}:`, error);
        }
    }

    return confirmed;
}
