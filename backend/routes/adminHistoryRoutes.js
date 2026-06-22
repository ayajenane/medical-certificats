import express from 'express';
import { getAdminHistory } from '../controllers/adminHistoryController.js';
import { protect, isSuperAdmin } from '../authMiddleware.js';

const router = express.Router();

router.get('/', protect, isSuperAdmin, getAdminHistory);

export default router;
