import { Router } from 'express';
import verifyJwtToken from '../middleware/auth.middleware.js';
import {
    confirmDraftHandler,
    createDraft,
    getDraft,
    listDrafts,
    rejectDraft,
    updateDraft,
} from '../controllers/drafts.controllers.js';

const router = Router();

router.post('/', verifyJwtToken, createDraft);
router.get('/', verifyJwtToken, listDrafts);
router.get('/:id', verifyJwtToken, getDraft);
router.patch('/:id', verifyJwtToken, updateDraft);
router.post('/:id/confirm', verifyJwtToken, confirmDraftHandler);
router.post('/:id/reject', verifyJwtToken, rejectDraft);

export default router;
