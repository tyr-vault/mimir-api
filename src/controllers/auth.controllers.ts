import type { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { userRepository } from '../repositories/user.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { generateAccessToken } from '../services/token.service.js';

interface RegisterBody {
    email: string;
    password: string;
    name: string;
}

interface LoginBody {
    email: string;
    password: string;
}

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name } = req.body as RegisterBody;

    if (!email?.trim() || !password || !name?.trim()) {
        throw new ApiError(400, 'email, password, and name are required');
    }

    if (password.length < 6) {
        throw new ApiError(400, 'password must be at least 6 characters');
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
        throw new ApiError(409, 'User already exists');
    }

    const user = await userRepository.create({
        email: email.trim(),
        password,
        name: name.trim(),
    });

    await categoryRepository.seedDefaults(user.id);

    const token = generateAccessToken(user);

    res.status(201).json(
        new ApiResponse(201, { token, user }, 'User registered successfully'),
    );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as LoginBody;

    if (!email?.trim() || !password) {
        throw new ApiError(400, 'email and password are required');
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const valid = await userRepository.isPasswordMatch(user.password, password);
    if (!valid) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const { password: _password, ...safeUser } = user;
    const token = generateAccessToken(safeUser);

    res.status(200).json(new ApiResponse(200, { token, user: safeUser }, 'Login successful'));
});
