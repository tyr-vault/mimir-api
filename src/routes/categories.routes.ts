import { Router } from 'express';
import verifyJwtToken from '../middleware/auth.middleware.js';
import { createCategory, listCategories } from '../controllers/categories.controllers.js';

const router = Router();

router.get('/', verifyJwtToken, listCategories);
router.post('/', verifyJwtToken, createCategory);

export default router;
