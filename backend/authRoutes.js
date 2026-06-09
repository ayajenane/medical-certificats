import express from 'express';
import { register, login } from './authController.js';
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

export default router;
