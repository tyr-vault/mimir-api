import type { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { transactionRepository } from '../repositories/transaction.repository.js';
import { confirmExpiredDrafts } from '../services/draft.service.js';
import type {
    TransactionFilters,
    TransactionType,
    UpdateTransactionInput,
} from '../types/transaction.types.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const parseType = (value: unknown): TransactionType | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === 'expense' || value === 'income') return value;
    throw new ApiError(400, 'type must be expense or income');
};

const parseDate = (value: unknown, field: string): string => {
    if (typeof value !== 'string' || !ISO_DATE.test(value)) {
        throw new ApiError(400, `${field} must be YYYY-MM-DD`);
    }
    return value;
};

const parseOptionalDate = (value: unknown, field: string): string | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseDate(value, field);
};

const parseFilters = (query: Request['query']): TransactionFilters => {
    const limit = query.limit !== undefined ? Number(query.limit) : undefined;
    const offset = query.offset !== undefined ? Number(query.offset) : undefined;

    if (limit !== undefined && (Number.isNaN(limit) || limit < 1)) {
        throw new ApiError(400, 'limit must be a positive number');
    }
    if (offset !== undefined && (Number.isNaN(offset) || offset < 0)) {
        throw new ApiError(400, 'offset must be a non-negative number');
    }

    return {
        from: parseOptionalDate(query.from, 'from'),
        to: parseOptionalDate(query.to, 'to'),
        type: parseType(query.type),
        categoryId: typeof query.categoryId === 'string' ? query.categoryId : undefined,
        limit,
        offset,
    };
};

const ensureCategoryOwned = async (categoryId: string, userId: string): Promise<void> => {
    const category = await categoryRepository.findByIdForUser(categoryId, userId);
    if (!category) {
        throw new ApiError(400, 'categoryId is invalid');
    }
};

export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
    const { categoryId, type, amount, date, note } = req.body as {
        categoryId?: string;
        type?: TransactionType;
        amount?: number;
        date?: string;
        note?: string | null;
    };

    if (!categoryId || type === undefined || amount === undefined || !date) {
        throw new ApiError(400, 'categoryId, type, amount, and date are required');
    }

    const parsedType = parseType(type);
    if (!parsedType) {
        throw new ApiError(400, 'type must be expense or income');
    }

    if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
        throw new ApiError(400, 'amount must be a positive number');
    }

    const parsedDate = parseDate(date, 'date');
    await ensureCategoryOwned(categoryId, req.user.id);

    const transaction = await transactionRepository.create({
        userId: req.user.id,
        categoryId,
        type: parsedType,
        amount,
        date: parsedDate,
        note: note ?? null,
    });

    res.status(201).json(new ApiResponse(201, transaction, 'Transaction created'));
});

export const listTransactions = asyncHandler(async (req: Request, res: Response) => {
    await confirmExpiredDrafts(req.user.id);
    const filters = parseFilters(req.query);
    const transactions = await transactionRepository.list(req.user.id, filters);
    res.status(200).json(new ApiResponse(200, transactions, 'Transactions retrieved'));
});

const getParamId = (req: Request): string => {
    const id = req.params.id;
    if (typeof id !== 'string' || !id) {
        throw new ApiError(400, 'id is required');
    }
    return id;
};

export const getTransaction = asyncHandler(async (req: Request, res: Response) => {
    const id = getParamId(req);

    const transaction = await transactionRepository.findByIdForUser(id, req.user.id);
    if (!transaction) {
        throw new ApiError(404, 'Transaction not found');
    }

    res.status(200).json(new ApiResponse(200, transaction, 'Transaction retrieved'));
});

export const updateTransaction = asyncHandler(async (req: Request, res: Response) => {
    const id = getParamId(req);

    const body = req.body as UpdateTransactionInput;
    const fields: UpdateTransactionInput = {};

    if (body.categoryId !== undefined) {
        await ensureCategoryOwned(body.categoryId, req.user.id);
        fields.categoryId = body.categoryId;
    }
    if (body.type !== undefined) {
        fields.type = parseType(body.type);
    }
    if (body.amount !== undefined) {
        if (typeof body.amount !== 'number' || Number.isNaN(body.amount) || body.amount <= 0) {
            throw new ApiError(400, 'amount must be a positive number');
        }
        fields.amount = body.amount;
    }
    if (body.date !== undefined) {
        fields.date = parseDate(body.date, 'date');
    }
    if (body.note !== undefined) {
        fields.note = body.note;
    }

    if (Object.keys(fields).length === 0) {
        throw new ApiError(400, 'At least one field is required to update');
    }

    const transaction = await transactionRepository.update(id, req.user.id, fields);
    if (!transaction) {
        throw new ApiError(404, 'Transaction not found');
    }

    res.status(200).json(new ApiResponse(200, transaction, 'Transaction updated'));
});

export const deleteTransaction = asyncHandler(async (req: Request, res: Response) => {
    const id = getParamId(req);

    const deleted = await transactionRepository.delete(id, req.user.id);
    if (!deleted) {
        throw new ApiError(404, 'Transaction not found');
    }

    res.status(200).json(new ApiResponse(200, null, 'Transaction deleted'));
});
