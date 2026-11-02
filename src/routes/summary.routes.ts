import { Router } from 'express';
import verifyJwtToken from '../middleware/auth.middleware.js';
import {
    getCategorySummary,
    getMonthlySummary,
    getSummary,
} from '../controllers/summary.controllers.js';

const router = Router();

router.get('/', verifyJwtToken, getSummary);
router.get('/categories', verifyJwtToken, getCategorySummary);
router.get('/monthly', verifyJwtToken, getMonthlySummary);

export default router;
