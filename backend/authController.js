import User from './User.js';
import jwt from 'jsonwebtoken';
import { recordAdminHistory } from './services/adminHistoryService.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const register = async (req, res) => {
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
    await user.save();

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
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Veuillez fournir email et mot de passe' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
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
    res.status(500).json({ message: error.message });
  }
};

export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs' });
    }

    const existing = await User.findOne({ email, _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

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

export const deleteAdmin = async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
};

export const resetAdminPassword = async (req, res) => {
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

    admin.password = newPassword;
    await admin.save();

    recordAdminHistory({
      admin,
      action: 'ADMIN_PASSWORD_RESET',
      performedBy: req.user,
    }).catch(() => {});

    res.status(200).json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
};
