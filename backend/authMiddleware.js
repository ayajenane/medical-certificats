import jwt from 'jsonwebtoken';
import User from './User.js';

// à mettre après protect, suppose que req.user existe déjà
export const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    return next();
  }
  res.status(403).json({ message: 'Accès réservé au super administrateur' });
};

// middleware d'authentification, à placer sur toute route qui nécessite un utilisateur connecté
export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]; // format "Bearer <token>"
    }

    if (!token) {
      return res.status(401).json({ message: 'Non autorisé à accéder à cette route' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // throw si expiré ou signature invalide
      req.user = await User.findById(decoded.id); // password non sélectionné par défaut, pas besoin ici
      next();
    } catch {
      // regroupe token invalide, expiré ou signature incorrecte sous un même message générique
      return res.status(401).json({ message: 'Token invalide' });
    }
  } catch (error) {
    next(error);
  }
};
