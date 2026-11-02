import type { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { categoryRepository } from '../repositories/category.repository.js';

interface CreateCategoryBody {
    name: string;
}

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await categoryRepository.findByUserId(req.user.id);
    res.status(200).json(new ApiResponse(200, categories, 'Categories retrieved'));
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body as CreateCategoryBody;

    if (!name?.trim()) {
        throw new ApiError(400, 'name is required');
    }

    try {
        const category = await categoryRepository.create({
            userId: req.user.id,
            name: name.trim(),
        });
        res.status(201).json(new ApiResponse(201, category, 'Category created'));
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('unique') || message.includes('duplicate')) {
            throw new ApiError(409, 'Category already exists');
        }
        throw error;
    }
});
