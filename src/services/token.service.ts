import jwt, { type SignOptions } from 'jsonwebtoken';
import type { AuthUser } from '../types/user.types.js';

const signToken = (payload: object, secret: string, expiresIn: string | undefined): string => {
    const options: SignOptions = {};
    if (expiresIn) {
        options.expiresIn = expiresIn as SignOptions['expiresIn'];
    }
    return jwt.sign(payload, secret, options);
};

export const generateAccessToken = (user: AuthUser): string => {
    const accessSecret = process.env.ACCESS_TOKEN_SECRET_KEY;
    if (!accessSecret) {
        throw new Error('ACCESS_TOKEN_SECRET_KEY is not configured');
    }

    return signToken(
        {
            id: user.id,
            email: user.email,
            name: user.name,
        },
        accessSecret,
        process.env.ACCESS_TOKEN_SECRET_EXPIRY,
    );
};

export const verifyAccessToken = (token: string): AuthUser => {
    const accessSecret = process.env.ACCESS_TOKEN_SECRET_KEY;
    if (!accessSecret) {
        throw new Error('ACCESS_TOKEN_SECRET_KEY is not configured');
    }

    const decoded = jwt.verify(token, accessSecret);
    if (typeof decoded === 'string') {
        throw new Error('Invalid token payload');
    }

    const { id, email, name } = decoded as Partial<AuthUser>;
    if (!id || !email || !name) {
        throw new Error('Invalid token payload');
    }

    return { id, email, name };
};
