import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getAdmins, updateAdmin, deleteAdmin, resetAdminPassword, changePassword, updateMe } from './authController.js';
import { protect, isSuperAdmin } from './authMiddleware.js';

const router = express.Router();

// limite les tentatives de login pour ralentir le brute-force sur les mots de passe
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // fenêtre de 15min
  max: 10, // 10 essais max par IP sur la fenêtre, anti brute-force
  message: { success: false, message: 'Trop de tentatives de connexion, réessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', protect, isSuperAdmin, register); // seul un superadmin connecté peut créer un admin
router.post('/login', loginLimiter, login);
// route simple pour récupérer l'utilisateur courant, pas besoin d'un vrai controller
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
});

// gestion des comptes admin, toutes réservées au superadmin
router.get('/admins', protect, isSuperAdmin, getAdmins);
router.put('/admins/:id', protect, isSuperAdmin, updateAdmin);
router.delete('/admins/:id', protect, isSuperAdmin, deleteAdmin);
router.put('/admins/:id/reset-password', protect, isSuperAdmin, resetAdminPassword);
// routes pour que l'utilisateur connecté gère son propre profil
router.put('/me', protect, updateMe);
router.put('/change-password', protect, changePassword);

export default router;
