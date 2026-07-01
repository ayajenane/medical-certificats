import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getAdmins, updateAdmin, deleteAdmin, resetAdminPassword, changePassword, updateMe } from './authController.js';
import { protect, isSuperAdmin } from './authMiddleware.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Trop de tentatives de connexion, réessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', protect, isSuperAdmin, register);
router.post('/login', loginLimiter, login);
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
});

router.get('/admins', protect, isSuperAdmin, getAdmins);
router.put('/admins/:id', protect, isSuperAdmin, updateAdmin);
router.delete('/admins/:id', protect, isSuperAdmin, deleteAdmin);
router.put('/admins/:id/reset-password', protect, isSuperAdmin, resetAdminPassword);
router.put('/me', protect, updateMe);
router.put('/change-password', protect, changePassword);

export default router;
