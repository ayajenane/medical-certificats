import express from 'express';
import { getHistory, getHistoryById } from '../controllers/pilotHistoryController.js';
import { protect } from '../authMiddleware.js';

const router = express.Router();

// historique des pilotes accessible à tout utilisateur connecté (pas réservé au super admin)
router.use(protect);

router.get('/', getHistory);
router.get('/:id', getHistoryById);

export default router;
