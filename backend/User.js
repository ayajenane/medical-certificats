import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Le nom d\'utilisateur est requis'],
    trim: true,
    minlength: [2, 'Le nom d\'utilisateur doit contenir au moins 2 caractères'],
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: [true, 'Cet email est déjà utilisé'],
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Veuillez fournir un email valide'],
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false,
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin'],
    default: 'admin',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hasher le mot de passe avant la sauvegarde
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
});

// Méthode pour comparer les mots de passe
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
