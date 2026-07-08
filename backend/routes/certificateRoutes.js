import express from 'express';
import {
  createCertificate,
  getCertificates,
  getCertificate,
  getCertificatesByPilot,
} from '../controllers/certificateController.js';
import { protect } from '../authMiddleware.js';

const router = express.Router();

// toutes les routes certificats nécessitent d'être connecté
router.use(protect);

router.get('/', getCertificates);
router.post('/', createCertificate);
// route par pilote déclarée avant '/:id' pour que 'pilot' ne soit pas pris pour un id
router.get('/pilot/:pilotId', getCertificatesByPilot);
router.get('/:id', getCertificate);

export default router;
