import type { AuthUser } from './user.types.ts';

declare global {
    namespace Express {
        interface Request {
            user: AuthUser;
        }
    }
}

export {};
