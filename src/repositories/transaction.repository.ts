import type { Knex } from 'knex';
import db from '../db/knex.js';
import type {
    CategorySummary,
    CreateTransactionInput,
    MonthlySummary,
    PeriodSummary,
    Transaction,
    TransactionFilters,
    TransactionRow,
    TransactionType,
    UpdateTransactionInput,
} from '../types/transaction.types.js';
import { mapTransactionRow } from '../utils/mappers.js';

const TRANSACTIONS = 'transactions';
const CATEGORIES = 'categories';

const applyFilters = <T extends Knex.QueryBuilder>(
    query: T,
    userId: string,
    filters: TransactionFilters,
): T => {
    query.where(`${TRANSACTIONS}.user_id`, userId);

    if (filters.from) {
        query.andWhere(`${TRANSACTIONS}.date`, '>=', filters.from);
    }
    if (filters.to) {
        query.andWhere(`${TRANSACTIONS}.date`, '<=', filters.to);
    }
    if (filters.type) {
        query.andWhere(`${TRANSACTIONS}.type`, filters.type);
    }
    if (filters.categoryId) {
        query.andWhere(`${TRANSACTIONS}.category_id`, filters.categoryId);
    }

    return query;
};

export const transactionRepository = {
    async create(input: CreateTransactionInput): Promise<Transaction> {
        const [row] = await db<TransactionRow>(TRANSACTIONS)
            .insert({
                user_id: input.userId,
                category_id: input.categoryId,
                type: input.type,
                amount: input.amount,
                date: input.date,
                note: input.note ?? null,
            })
            .returning('*');

        if (!row) {
            throw new Error('Failed to create transaction');
        }

        const created = await this.findByIdForUser(row.id, input.userId);
        if (!created) {
            throw new Error('Failed to load created transaction');
        }
        return created;
    },

    async findByIdForUser(id: string, userId: string): Promise<Transaction | null> {
        const row = await db<TransactionRow>(TRANSACTIONS)
            .select(`${TRANSACTIONS}.*`, `${CATEGORIES}.name as category_name`)
            .leftJoin(CATEGORIES, `${CATEGORIES}.id`, `${TRANSACTIONS}.category_id`)
            .where({ [`${TRANSACTIONS}.id`]: id, [`${TRANSACTIONS}.user_id`]: userId })
            .first();

        return row ? mapTransactionRow(row) : null;
    },

    async list(userId: string, filters: TransactionFilters): Promise<Transaction[]> {
        const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);
        const offset = Math.max(filters.offset ?? 0, 0);

        const query = applyFilters(
            db<TransactionRow>(TRANSACTIONS)
                .select(`${TRANSACTIONS}.*`, `${CATEGORIES}.name as category_name`)
                .leftJoin(CATEGORIES, `${CATEGORIES}.id`, `${TRANSACTIONS}.category_id`),
            userId,
            filters,
        );

        const rows = await query
            .orderBy(`${TRANSACTIONS}.date`, 'desc')
            .orderBy(`${TRANSACTIONS}.created_at`, 'desc')
            .limit(limit)
            .offset(offset);

        return rows.map(mapTransactionRow);
    },

    async update(
        id: string,
        userId: string,
        fields: UpdateTransactionInput,
    ): Promise<Transaction | null> {
        const updateData: Record<string, unknown> = {};
        if (fields.categoryId !== undefined) updateData.category_id = fields.categoryId;
        if (fields.type !== undefined) updateData.type = fields.type;
        if (fields.amount !== undefined) updateData.amount = fields.amount;
        if (fields.date !== undefined) updateData.date = fields.date;
        if (fields.note !== undefined) updateData.note = fields.note;

        if (Object.keys(updateData).length === 0) {
            return this.findByIdForUser(id, userId);
        }

        const updated = await db(TRANSACTIONS).where({ id, user_id: userId }).update(updateData);
        if (updated === 0) return null;

        return this.findByIdForUser(id, userId);
    },

    async delete(id: string, userId: string): Promise<boolean> {
        const count = await db(TRANSACTIONS).where({ id, user_id: userId }).delete();
        return count > 0;
    },

    async getPeriodSummary(
        userId: string,
        filters: TransactionFilters,
    ): Promise<PeriodSummary> {
        const query = applyFilters(db(TRANSACTIONS), userId, filters);

        const result = await query
            .select(
                db.raw(
                    `COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income`,
                ),
                db.raw(
                    `COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense`,
                ),
                db.raw('COUNT(*)::int as count'),
            )
            .first();

        const totalIncome = Number(result?.total_income ?? 0);
        const totalExpense = Number(result?.total_expense ?? 0);

        return {
            from: filters.from,
            to: filters.to,
            type: filters.type,
            totalIncome,
            totalExpense,
            net: totalIncome - totalExpense,
            count: Number(result?.count ?? 0),
        };
    },

    async getCategorySummary(
        userId: string,
        filters: TransactionFilters,
    ): Promise<CategorySummary[]> {
        const query = applyFilters(
            db(TRANSACTIONS)
                .select(
                    `${TRANSACTIONS}.category_id`,
                    `${CATEGORIES}.name`,
                    db.raw('COALESCE(SUM(amount), 0) as total'),
                    db.raw('COUNT(*)::int as count'),
                )
                .leftJoin(CATEGORIES, `${CATEGORIES}.id`, `${TRANSACTIONS}.category_id`),
            userId,
            filters,
        );

        const rows = await query
            .groupBy(`${TRANSACTIONS}.category_id`, `${CATEGORIES}.name`)
            .orderBy('total', 'desc');

        return (
            rows as Array<{
                category_id: string;
                name: string;
                total: string | number;
                count: number;
            }>
        ).map((row) => ({
            categoryId: row.category_id,
            name: row.name,
            total: Number(row.total),
            count: Number(row.count),
        }));
    },

    async getMonthlySummary(
        userId: string,
        year: number,
        type?: TransactionType,
    ): Promise<MonthlySummary[]> {
        let query = db(TRANSACTIONS)
            .where({ user_id: userId })
            .andWhereRaw('EXTRACT(YEAR FROM date) = ?', [year]);

        if (type) {
            query = query.andWhere({ type });
        }

        const rows = await query
            .select(
                db.raw(`TO_CHAR(date, 'YYYY-MM') as month`),
                db.raw(
                    `COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income`,
                ),
                db.raw(
                    `COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense`,
                ),
            )
            .groupByRaw(`TO_CHAR(date, 'YYYY-MM')`)
            .orderBy('month', 'asc');

        return (
            rows as Array<{
                month: string;
                total_income: string | number;
                total_expense: string | number;
            }>
        ).map((row) => {
            const totalIncome = Number(row.total_income);
            const totalExpense = Number(row.total_expense);
            return {
                month: row.month,
                totalIncome,
                totalExpense,
                net: totalIncome - totalExpense,
            };
        });
    },
};
