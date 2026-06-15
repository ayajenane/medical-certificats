import jwt from 'jsonwebtoken';
import User from './User.js';

export const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    return next();
  }
  res.status(403).json({ message: 'Accès réservé au super administrateur' });
};

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Non autorisé à accéder à cette route' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
      next();
    } catch {
      return res.status(401).json({ message: 'Token invalide' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
