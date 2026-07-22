import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './authRoutes.js';
import pilotRoutes from './routes/pilotRoutes.js';
import pilotHistoryRoutes from './routes/pilotHistoryRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminHistoryRoutes from './routes/adminHistoryRoutes.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// helmet ajoute des headers HTTP de sécurité par défaut (contre XSS, sniffing, etc.)
app.use(helmet());
// cors restreint l'accès à l'origine du front, credentials permet l'envoi du cookie/token
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// limiteur général sur toute l'API, les routes sensibles (login, register...) ont en plus leur propre limiteur
app.use('/api', apiLimiter);

// un routeur par ressource, montés sous /api/<ressource>
app.use('/api/auth', authRoutes);
app.use('/api/pilots', pilotRoutes);
app.use('/api/pilot-history', pilotHistoryRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin-history', adminHistoryRoutes);

// route racine utilisée comme simple health check
app.get('/', (req, res) => {
  res.json({ message: 'Backend Dashboard App est actif' });
});

// attrape toute route non définie plus haut, doit rester avant le error handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// gestionnaire d'erreur centralisé, doit rester en tout dernier (signature à 4 arguments requise par Express)
app.use(errorHandler);

export default app;
