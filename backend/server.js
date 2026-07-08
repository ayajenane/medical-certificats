import 'dotenv/config'; // charge le .env avant tout le reste, sinon process.env serait vide
import connectDB from './db.js';
import app from './app.js';

// connexion DB lancée en parallèle du démarrage HTTP, pas besoin d'attendre pour écouter le port
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
