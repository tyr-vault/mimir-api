import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../services/token.service.js';

const verifyJwtToken = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
        const authorizationHeader = req.header('Authorization');
        const token = authorizationHeader?.replace('Bearer ', '') ?? '';

        if (!token) {
            throw new ApiError(401, 'Unauthorized');
        }

        const user = verifyAccessToken(token);
        req.user = user;
        next();
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            next(error);
            return;
        }
        next(new ApiError(401, 'Invalid or expired token'));
    }
};

export default verifyJwtToken;
