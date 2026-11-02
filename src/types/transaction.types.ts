export type TransactionType = 'expense' | 'income';

export interface Transaction {
    id: string;
    userId: string;
    categoryId: string;
    categoryName?: string;
    type: TransactionType;
    amount: number;
    date: string;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface TransactionRow {
    id: string;
    user_id: string;
    category_id: string;
    type: TransactionType;
    amount: string | number;
    date: Date | string;
    note: string | null;
    created_at: Date;
    updated_at: Date;
    category_name?: string;
}

export interface CreateTransactionInput {
    userId: string;
    categoryId: string;
    type: TransactionType;
    amount: number;
    date: string;
    note?: string | null;
}

export interface UpdateTransactionInput {
    categoryId?: string;
    type?: TransactionType;
    amount?: number;
    date?: string;
    note?: string | null;
}

export interface TransactionFilters {
    from?: string;
    to?: string;
    type?: TransactionType;
    categoryId?: string;
    limit?: number;
    offset?: number;
}

export interface PeriodSummary {
    from?: string;
    to?: string;
    type?: TransactionType;
    totalIncome: number;
    totalExpense: number;
    net: number;
    count: number;
}

export interface CategorySummary {
    categoryId: string;
    name: string;
    total: number;
    count: number;
}

export interface MonthlySummary {
    month: string;
    totalIncome: number;
    totalExpense: number;
    net: number;
}
