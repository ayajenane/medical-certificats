import express from 'express';
import { getStats } from '../controllers/dashboardController.js';
import { protect } from '../authMiddleware.js';

const router = express.Router();

// dashboard réservé aux utilisateurs connectés (admin ou pas)
router.use(protect);

// seule route exposée, tous les chiffres agrégés sont renvoyés en une fois
router.get('/stats', getStats);

export default router;
