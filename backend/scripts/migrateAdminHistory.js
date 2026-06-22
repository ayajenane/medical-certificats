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
  for (const admin of admins) {
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

run().catch((err) => { console.error(err); process.exit(1); });
