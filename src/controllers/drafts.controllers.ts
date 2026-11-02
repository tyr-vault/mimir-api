import type { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { draftRepository } from '../repositories/draft.repository.js';
import type { DraftKind, DraftStatus } from '../types/draft.types.js';
import {
    confirmDraft,
    confirmExpiredDrafts,
    validatePayloadForKind,
} from '../services/draft.service.js';

const getParamId = (req: Request): string => {
    const id = req.params.id;
    if (typeof id !== 'string' || !id) {
        throw new ApiError(400, 'id is required');
    }
    return id;
};

const parseKind = (value: unknown): DraftKind => {
    if (value === 'transaction' || value === 'category') return value;
    throw new ApiError(400, 'kind must be transaction or category');
};

const parseStatus = (value: unknown): DraftStatus => {
    if (value === undefined || value === null || value === '') return 'pending';
    if (value === 'pending' || value === 'confirmed' || value === 'rejected') return value;
    throw new ApiError(400, 'status must be pending, confirmed, or rejected');
};

export const createDraft = asyncHandler(async (req: Request, res: Response) => {
    const { kind, payload, source } = req.body as {
        kind?: unknown;
        payload?: unknown;
        source?: string;
    };

    const parsedKind = parseKind(kind);
    const validatedPayload = validatePayloadForKind(parsedKind, payload);

    const draft = await draftRepository.create({
        userId: req.user.id,
        kind: parsedKind,
        payload: validatedPayload,
        source: typeof source === 'string' && source.trim() ? source.trim() : 'bot',
    });

    res.status(201).json(new ApiResponse(201, draft, 'Draft created'));
});

export const listDrafts = asyncHandler(async (req: Request, res: Response) => {
    await confirmExpiredDrafts(req.user.id);
    const status = parseStatus(req.query.status);
    const drafts = await draftRepository.list(req.user.id, status);
    res.status(200).json(new ApiResponse(200, drafts, 'Drafts retrieved'));
});

export const getDraft = asyncHandler(async (req: Request, res: Response) => {
    await confirmExpiredDrafts(req.user.id);
    const id = getParamId(req);
    const draft = await draftRepository.findByIdForUser(id, req.user.id);
    if (!draft) {
        throw new ApiError(404, 'Draft not found');
    }
    res.status(200).json(new ApiResponse(200, draft, 'Draft retrieved'));
});

export const updateDraft = asyncHandler(async (req: Request, res: Response) => {
    const id = getParamId(req);
    const existing = await draftRepository.findByIdForUser(id, req.user.id);
    if (!existing) {
        throw new ApiError(404, 'Draft not found');
    }
    if (existing.status !== 'pending') {
        throw new ApiError(400, `Draft is already ${existing.status}`);
    }

    const { payload } = req.body as { payload?: unknown };
    const validatedPayload = validatePayloadForKind(existing.kind, payload);
    const updated = await draftRepository.updatePayload(id, req.user.id, {
        payload: validatedPayload,
    });
    if (!updated) {
        throw new ApiError(404, 'Draft not found');
    }

    res.status(200).json(new ApiResponse(200, updated, 'Draft updated'));
});

export const confirmDraftHandler = asyncHandler(async (req: Request, res: Response) => {
    const id = getParamId(req);
    const { draft, result } = await confirmDraft(id, req.user.id);
    res.status(200).json(
        new ApiResponse(200, { draft, result }, 'Draft confirmed'),
    );
});

export const rejectDraft = asyncHandler(async (req: Request, res: Response) => {
    const id = getParamId(req);
    const existing = await draftRepository.findByIdForUser(id, req.user.id);
    if (!existing) {
        throw new ApiError(404, 'Draft not found');
    }
    if (existing.status !== 'pending') {
        throw new ApiError(400, `Draft is already ${existing.status}`);
    }

    const rejected = await draftRepository.markRejected(id, req.user.id);
    if (!rejected) {
        throw new ApiError(404, 'Draft not found');
    }

    res.status(200).json(new ApiResponse(200, rejected, 'Draft rejected'));
});
