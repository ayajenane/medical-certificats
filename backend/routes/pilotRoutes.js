import express from 'express';
import {
  getPilots,
  getPilot,
  createPilot,
  updatePilot,
  renewPilot,
  archivePilot,
  restorePilot,
  deletePilot,
} from '../controllers/pilotController.js';
import { protect } from '../authMiddleware.js';

const router = express.Router();

// toutes les routes pilotes nécessitent d'être connecté
router.use(protect);

router.get('/', getPilots);
router.post('/', createPilot);
router.get('/:id', getPilot);
router.put('/:id', updatePilot);
// actions ciblées en PATCH plutôt que via updatePilot, chacune a sa propre logique métier
router.patch('/:id/renew', renewPilot);
router.patch('/:id/archive', archivePilot);
router.patch('/:id/restore', restorePilot);
router.delete('/:id', deletePilot);

export default router;
