import express from 'express';
import { getAdminHistory } from '../controllers/adminHistoryController.js';
import { protect, isSuperAdmin } from '../authMiddleware.js';

const router = express.Router();

// protect vérifie le token, isSuperAdmin vérifie le rôle : réservé au super admin,
// contrairement aux autres routes d'historique
router.get('/', protect, isSuperAdmin, getAdminHistory);

export default router;
