import express from 'express';
import {
  createCertificate,
  getCertificates,
  getCertificate,
  getCertificatesByPilot,
} from '../controllers/certificateController.js';
import { protect } from '../authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getCertificates);
router.post('/', createCertificate);
router.get('/pilot/:pilotId', getCertificatesByPilot);
router.get('/:id', getCertificate);

export default router;
