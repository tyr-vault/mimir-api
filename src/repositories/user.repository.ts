import bcrypt from 'bcrypt';
import db from '../db/knex.js';
import type { CreateUserInput, User, UserRow } from '../types/user.types.js';
import { mapUserRow } from '../utils/mappers.js';

const USERS = 'users';

export const userRepository = {
    async findById(id: string): Promise<User | null> {
        const row = await db<UserRow>(USERS).where({ id }).first();
        return row ? mapUserRow(row) : null;
    },

    async findByEmail(email: string): Promise<(User & { password: string }) | null> {
        const row = await db<UserRow>(USERS).where({ email: email.toLowerCase() }).first();
        if (!row) return null;
        return { ...mapUserRow(row), password: row.password };
    },

    async create(input: CreateUserInput): Promise<User> {
        const hashedPassword = await bcrypt.hash(input.password, 10);
        const [row] = await db<UserRow>(USERS)
            .insert({
                email: input.email.toLowerCase(),
                password: hashedPassword,
                name: input.name,
            })
            .returning('*');

        if (!row) {
            throw new Error('Failed to create user');
        }

        return mapUserRow(row);
    },

    async isPasswordMatch(hashedPassword: string, password: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword);
    },
};
