import { categoryRepository } from '../repositories/category.repository.js';
import { transactionRepository } from '../repositories/transaction.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import type { TransactionType } from '../types/transaction.types.js';

export const DEMO_EMAIL = 'admin@example.com';
export const DEMO_PASSWORD = 'admin';
export const DEMO_NAME = 'Admin';

const daysAgo = (days: number): string => {
    const date = new Date();
    date.setUTCHours(12, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - days);
    return date.toISOString().slice(0, 10);
};

interface DemoTx {
    category: string;
    type: TransactionType;
    amount: number;
    daysAgo: number;
    note: string;
}

const DEMO_TRANSACTIONS: DemoTx[] = [
    { category: 'Income', type: 'income', amount: 4500, daysAgo: 28, note: 'Monthly salary' },
    { category: 'Housing', type: 'expense', amount: 1200, daysAgo: 27, note: 'Rent' },
    { category: 'Groceries', type: 'expense', amount: 86.4, daysAgo: 25, note: 'Weekly groceries' },
    { category: 'Transport', type: 'expense', amount: 45, daysAgo: 24, note: 'Transit pass' },
    { category: 'Food', type: 'expense', amount: 32.5, daysAgo: 22, note: 'Lunch out' },
    { category: 'Health', type: 'expense', amount: 60, daysAgo: 20, note: 'Pharmacy' },
    { category: 'Personal', type: 'expense', amount: 29.9, daysAgo: 18, note: 'Streaming' },
    { category: 'Groceries', type: 'expense', amount: 74.2, daysAgo: 15, note: 'Supermarket' },
    { category: 'Food', type: 'expense', amount: 18.75, daysAgo: 12, note: 'Coffee & snacks' },
    { category: 'Transport', type: 'expense', amount: 28, daysAgo: 10, note: 'Rideshare' },
    { category: 'Other', type: 'expense', amount: 55, daysAgo: 8, note: 'Home supplies' },
    { category: 'Groceries', type: 'expense', amount: 91.1, daysAgo: 6, note: 'Weekly groceries' },
    { category: 'Food', type: 'expense', amount: 42, daysAgo: 4, note: 'Dinner' },
    { category: 'Personal', type: 'expense', amount: 15, daysAgo: 3, note: 'Books' },
    { category: 'Health', type: 'expense', amount: 25, daysAgo: 2, note: 'Gym day pass' },
    { category: 'Food', type: 'expense', amount: 12.5, daysAgo: 1, note: 'Breakfast' },
    { category: 'Income', type: 'income', amount: 200, daysAgo: 5, note: 'Freelance gig' },
];

/**
 * Idempotent showcase seed for local/dev. Safe to call on every boot.
 */
export const seedDemoData = async (): Promise<void> => {
    const existing = await userRepository.findByEmail(DEMO_EMAIL);
    if (existing) {
        console.info(`Demo data already present (${DEMO_EMAIL} / ${DEMO_PASSWORD})`);
        return;
    }

    const user = await userRepository.create({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        name: DEMO_NAME,
    });

    const categories = await categoryRepository.seedDefaults(user.id);
    const byName = new Map(categories.map((c) => [c.name, c.id]));

    for (const item of DEMO_TRANSACTIONS) {
        const categoryId = byName.get(item.category);
        if (!categoryId) {
            throw new Error(`Missing seeded category: ${item.category}`);
        }

        await transactionRepository.create({
            userId: user.id,
            categoryId,
            type: item.type,
            amount: item.amount,
            date: daysAgo(item.daysAgo),
            note: item.note,
        });
    }

    console.info(
        `Demo data seeded — login with ${DEMO_EMAIL} / ${DEMO_PASSWORD} (${DEMO_TRANSACTIONS.length} transactions)`,
    );
};
