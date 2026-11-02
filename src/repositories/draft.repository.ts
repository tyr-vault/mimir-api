import db from '../db/knex.js';
import type {
    CreateDraftInput,
    Draft,
    DraftRow,
    DraftStatus,
    UpdateDraftInput,
} from '../types/draft.types.js';
import { mapDraftRow } from '../utils/mappers.js';

const DRAFTS = 'drafts';
export const DRAFT_AUTO_CONFIRM_DAYS = 3;

export const draftRepository = {
    async create(input: CreateDraftInput): Promise<Draft> {
        const [row] = await db<DraftRow>(DRAFTS)
            .insert({
                user_id: input.userId,
                kind: input.kind,
                status: 'pending',
                payload: input.payload,
                source: input.source ?? 'bot',
            })
            .returning('*');

        if (!row) {
            throw new Error('Failed to create draft');
        }

        return mapDraftRow(row);
    },

    async findByIdForUser(id: string, userId: string): Promise<Draft | null> {
        const row = await db<DraftRow>(DRAFTS).where({ id, user_id: userId }).first();
        return row ? mapDraftRow(row) : null;
    },

    async list(
        userId: string,
        status: DraftStatus = 'pending',
    ): Promise<Draft[]> {
        const rows = await db<DraftRow>(DRAFTS)
            .where({ user_id: userId, status })
            .orderBy('created_at', 'desc');
        return rows.map(mapDraftRow);
    },

    async listExpiredPending(userId: string, olderThanDays = DRAFT_AUTO_CONFIRM_DAYS): Promise<Draft[]> {
        const rows = await db<DraftRow>(DRAFTS)
            .where({ user_id: userId, status: 'pending' })
            .andWhereRaw(`created_at <= NOW() - (? * INTERVAL '1 day')`, [olderThanDays])
            .orderBy('created_at', 'asc');
        return rows.map(mapDraftRow);
    },

    async updatePayload(
        id: string,
        userId: string,
        fields: UpdateDraftInput,
    ): Promise<Draft | null> {
        const updated = await db(DRAFTS)
            .where({ id, user_id: userId, status: 'pending' })
            .update({
                payload: fields.payload,
                updated_at: db.fn.now(),
            });

        if (updated === 0) return null;
        return this.findByIdForUser(id, userId);
    },

    async markConfirmed(id: string, userId: string): Promise<Draft | null> {
        const updated = await db(DRAFTS)
            .where({ id, user_id: userId, status: 'pending' })
            .update({
                status: 'confirmed',
                confirmed_at: db.fn.now(),
                updated_at: db.fn.now(),
            });

        if (updated === 0) return null;
        return this.findByIdForUser(id, userId);
    },

    async markRejected(id: string, userId: string): Promise<Draft | null> {
        const updated = await db(DRAFTS)
            .where({ id, user_id: userId, status: 'pending' })
            .update({
                status: 'rejected',
                rejected_at: db.fn.now(),
                updated_at: db.fn.now(),
            });

        if (updated === 0) return null;
        return this.findByIdForUser(id, userId);
    },

    async countPending(userId: string): Promise<number> {
        const result = await db(DRAFTS)
            .where({ user_id: userId, status: 'pending' })
            .count<{ count: string }>('id as count')
            .first();
        return Number(result?.count ?? 0);
    },
};
