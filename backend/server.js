import 'dotenv/config'; // charge le .env avant tout le reste, sinon process.env serait vide
import connectDB from './db.js';
import app from './app.js';

const DEFAULT_JWT_SECRET = 'your_jwt_secret_key_change_this_in_production';

// refuse de démarrer avec un secret JWT absent ou resté à sa valeur par défaut documentée dans le README
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_JWT_SECRET) {
  console.error('JWT_SECRET manquant ou laissé à sa valeur par défaut : définissez un secret fort dans .env avant de démarrer.');
  process.exit(1);
}

// erreurs non rattrapées (promesse rejetée sans catch, exception hors handler Express) : on log et on
// arrête proprement plutôt que de laisser le process continuer dans un état incertain
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// connexion DB lancée en parallèle du démarrage HTTP, pas besoin d'attendre pour écouter le port
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
