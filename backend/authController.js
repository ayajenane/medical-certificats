import User from './User.js';
import jwt from 'jsonwebtoken';
import { recordAdminHistory } from './services/adminHistoryService.js';

// génère le JWT contenant juste l'id, le rôle est relu en DB à chaque requête via protect
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // durée volontairement longue, pas de refresh token pour l'instant
  });
};

// création d'un compte admin, réservé au superadmin (voir isSuperAdmin sur la route)
export const register = async (req, res, next) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    user = new User({ username, email, password, role: 'admin' });
    await user.save(); // le hash du mot de passe se fait dans le hook pre('save') du modèle

    // log d'audit non bloquant : si ça échoue on ne veut pas faire échouer la création du compte
    recordAdminHistory({
      admin: user,
      action: 'ADMIN_CREATED',
      newData: { username: user.username, email: user.email },
      performedBy: req.user,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Compte administrateur créé avec succès',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// connexion, protégée par un rate limiter côté routes contre le brute-force
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Veuillez fournir email et mot de passe' });
    }

    const user = await User.findOne({ email }).select('+password'); // password exclu par défaut du schema, on le force ici

    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' }); // même message que "user inconnu" pour pas donner d'indice
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// liste des comptes admin (superadmin exclu implicitement par le filtre role)
export const getAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: admins });
  } catch (error) {
    next(error);
  }
};

export const updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs' });
    }

    // $ne exclut l'admin courant pour ne pas se bloquer soi-même sur son propre email
    const existing = await User.findOne({ email, _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // on garde l'ancien état avant update pour l'entrée d'historique (oldData/newData)
    const oldAdmin = await User.findOne({ _id: id, role: 'admin' }).select('-password');
    if (!oldAdmin) {
      return res.status(404).json({ message: 'Administrateur introuvable' });
    }

    const admin = await User.findOneAndUpdate(
      { _id: id, role: 'admin' },
      { username, email },
      { new: true, runValidators: true }
    ).select('-password');

    recordAdminHistory({
      admin,
      action: 'ADMIN_UPDATED',
      oldData: { username: oldAdmin.username, email: oldAdmin.email },
      newData: { username: admin.username, email: admin.email },
      performedBy: req.user,
    }).catch(() => {});

    res.status(200).json({ success: true, data: admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// suppression définitive d'un compte admin (pas de soft-delete côté User)
export const deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    const admin = await User.findOneAndDelete({ _id: id, role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Administrateur introuvable' });
    }

    recordAdminHistory({
      admin,
      action: 'ADMIN_DELETED',
      oldData: { username: admin.username, email: admin.email },
      performedBy: req.user,
    }).catch(() => {});

    res.status(200).json({ success: true, message: 'Administrateur supprimé' });
  } catch (error) {
    next(error);
  }
};

// réinitialisation du mot de passe d'un admin par le superadmin (pas besoin de connaître l'ancien)
export const resetAdminPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const admin = await User.findOne({ _id: id, role: 'admin' }).select('+password');
    if (!admin) {
      return res.status(404).json({ message: 'Administrateur introuvable' });
    }

    admin.password = newPassword; // réaffecté puis save() pour repasser par le hook de hash, pas de findByIdAndUpdate ici
    await admin.save();

    recordAdminHistory({
      admin,
      action: 'ADMIN_PASSWORD_RESET',
      performedBy: req.user,
    }).catch(() => {});

    res.status(200).json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    next(error);
  }
};

// mise à jour du profil de l'utilisateur connecté (pas d'historique, réservé aux comptes admin gérés par un superadmin)
export const updateMe = async (req, res, next) => {
  try {
    const { username, email } = req.body;
    if (!username?.trim() || !email?.trim()) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs' });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username: username.trim(), email: email.toLowerCase().trim() },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// changement de mot de passe par l'utilisateur lui-même, exige l'ancien mot de passe contrairement au reset admin
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Les nouveaux mots de passe ne correspondent pas' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    next(error);
  }
};
