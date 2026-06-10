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

router.use(protect);

router.get('/', getPilots);
router.post('/', createPilot);
router.get('/:id', getPilot);
router.put('/:id', updatePilot);
router.patch('/:id/renew', renewPilot);
router.patch('/:id/archive', archivePilot);
router.patch('/:id/restore', restorePilot);
router.delete('/:id', deletePilot);

export default router;
