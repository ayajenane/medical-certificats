import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './db.js';
import authRoutes from './authRoutes.js';
import pilotRoutes from './routes/pilotRoutes.js';
import pilotHistoryRoutes from './routes/pilotHistoryRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminHistoryRoutes from './routes/adminHistoryRoutes.js';
const app = express();

// Connecter à MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pilots', pilotRoutes);
app.use('/api/pilot-history', pilotHistoryRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin-history', adminHistoryRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Backend Dashboard App est actif' });
});

// Gestion des erreurs pour les routes non trouvées
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
