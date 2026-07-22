// crée le compte superadmin initial à partir des variables SUPER_ADMIN_* du .env, idempotent
// (ne fait rien si un superadmin existe déjà). À lancer via `npm run seed:admin`.
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../User.js';

async function run() {
  const { SUPER_ADMIN_USERNAME, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD } = process.env;

  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
    console.error('SUPER_ADMIN_EMAIL et SUPER_ADMIN_PASSWORD doivent être définis dans .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connecté');

  const existing = await User.findOne({ role: 'superadmin' });
  if (existing) {
    console.log(`Un superadmin existe déjà : ${existing.email} — rien à faire.`);
  } else {
    const superadmin = new User({
      username: SUPER_ADMIN_USERNAME || 'superadmin',
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD, // hashé par le hook pre('save') du modèle
      role: 'superadmin',
    });
    await superadmin.save();
    console.log(`Superadmin créé : ${superadmin.email}`);
  }

  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
