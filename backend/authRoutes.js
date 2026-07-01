import express from 'express';
import { register, login, getAdmins, updateAdmin, deleteAdmin, resetAdminPassword, changePassword, updateMe } from './authController.js';
import { protect, isSuperAdmin } from './authMiddleware.js';

const router = express.Router();

router.post('/register', protect, isSuperAdmin, register);
router.post('/login', login);
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
