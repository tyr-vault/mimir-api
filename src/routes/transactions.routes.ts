import { Router } from 'express';
import verifyJwtToken from '../middleware/auth.middleware.js';
import {
    createTransaction,
    deleteTransaction,
    getTransaction,
    listTransactions,
    updateTransaction,
} from '../controllers/transactions.controllers.js';

const router = Router();

router.post('/', verifyJwtToken, createTransaction);
router.get('/', verifyJwtToken, listTransactions);
router.get('/:id', verifyJwtToken, getTransaction);
router.patch('/:id', verifyJwtToken, updateTransaction);
router.delete('/:id', verifyJwtToken, deleteTransaction);

export default router;
