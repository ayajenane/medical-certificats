// script de migration ponctuel : à lancer une fois pour créer l'historique des admins existants
// avant l'introduction du modèle AdminHistory (ils n'avaient pas d'entrée ADMIN_CREATED)
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../User.js';
import AdminHistory from '../models/AdminHistory.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connecté');

  const admins = await User.find({ role: 'admin' }).select('-password');
  console.log(`${admins.length} admin(s) trouvé(s)`);

  let created = 0;
  // insertOne direct (pas AdminHistory.create) pour pouvoir forcer createdAt à la date réelle de l'admin
  for (const admin of admins) {
    // évite de dupliquer l'historique si le script est relancé
    const exists = await AdminHistory.findOne({ adminId: admin._id, action: 'ADMIN_CREATED' });
    if (!exists) {
      await AdminHistory.collection.insertOne({
        adminId: admin._id,
        adminName: admin.username,
        adminEmail: admin.email,
        action: 'ADMIN_CREATED',
        oldData: null,
        newData: { username: admin.username, email: admin.email },
        performedBy: { userId: null, username: 'Migration', email: null },
        // on garde la date de création réelle de l'admin, pas la date du script
        createdAt: admin.createdAt,
      });
      console.log(`  ✓ Historique créé pour : ${admin.username} (${admin.email})`);
      created++;
    } else {
      console.log(`  — Déjà présent : ${admin.username}`);
    }
  }

  console.log(`\nMigration terminée : ${created} entrée(s) créée(s).`);
  await mongoose.disconnect();
}

// exécution directe du script (node scripts/migrateAdminHistory.js), on quitte en erreur si ça plante
run().catch((err) => { console.error(err); process.exit(1); });
