import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

const salt = await bcryptjs.genSalt(10);
const hashedPassword = await bcryptjs.hash('superadmin123', salt);

await mongoose.connection.collection('users').insertOne({
  username: 'Super Admin',
  email: 'superadmin@dgac.ma',
  password: hashedPassword,
  role: 'superadmin',
  createdAt: new Date(),
});

console.log('Superadmin créé avec succès');
console.log('Email    : superadmin@dgac.ma');
console.log('Password : superadmin123');

await mongoose.disconnect();
