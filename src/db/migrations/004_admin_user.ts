import bcrypt from 'bcrypt';
import type { Knex } from 'knex';

const DEFAULT_CATEGORIES = [
    'Groceries',
    'Housing',
    'Transport',
    'Food',
    'Personal',
    'Health',
    'Income',
    'Other',
] as const;

function adminCredentials(): { email: string; password: string; name: string } | null {
    const email = (process.env.ADMIN_EMAIL ?? 'admin@example.com').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD ?? 'admin';
    const name = (process.env.ADMIN_NAME ?? 'Admin').trim();

    if (!email || !name) {
        console.warn('[migration 004] ADMIN_EMAIL and ADMIN_NAME required — skipping admin user');
        return null;
    }
    if (password.length < 6) {
        console.warn('[migration 004] ADMIN_PASSWORD must be at least 6 characters — skipping admin user');
        return null;
    }

    if (process.env.NODE_ENV === 'production' && password === 'admin') {
        console.warn(
            '[migration 004] Using default password "admin" in production — set ADMIN_PASSWORD in .env',
        );
    }

    return { email, password, name };
}

export async function up(knex: Knex): Promise<void> {
    const creds = adminCredentials();
    if (!creds) return;

    const existing = await knex('users').where({ email: creds.email }).first();
    if (existing) {
        return;
    }

    const hashedPassword = await bcrypt.hash(creds.password, 10);
    const inserted = await knex('users')
        .insert({
            email: creds.email,
            password: hashedPassword,
            name: creds.name,
        })
        .returning<{ id: string }[]>('id');

    const userId = inserted[0]?.id;
    if (!userId) {
        throw new Error('[migration 004] failed to insert admin user');
    }

    await knex('categories').insert(
        DEFAULT_CATEGORIES.map((categoryName) => ({
            user_id: userId,
            name: categoryName,
        })),
    );

    console.info(`[migration 004] admin user ready (${creds.email})`);
}

export async function down(knex: Knex): Promise<void> {
    const creds = adminCredentials();
    if (!creds) return;

    await knex('users').where({ email: creds.email }).delete();
}
