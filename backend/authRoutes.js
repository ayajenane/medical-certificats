import express from 'express';
import { register, login, getAdmins, updateAdmin, deleteAdmin, resetAdminPassword, changePassword, updateMe } from './authController.js';
import { protect, isSuperAdmin } from './authMiddleware.js';
import { loginLimiter, accountActionLimiter } from './middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', accountActionLimiter, protect, isSuperAdmin, register); // seul un superadmin connecté peut créer un admin
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
router.put('/admins/:id/reset-password', accountActionLimiter, protect, isSuperAdmin, resetAdminPassword);
// routes pour que l'utilisateur connecté gère son propre profil
router.put('/me', protect, updateMe);
router.put('/change-password', accountActionLimiter, protect, changePassword);

export default router;
