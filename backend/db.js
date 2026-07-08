import mongoose from 'mongoose';

// établit la connexion Mongoose au démarrage du serveur, appelé une seule fois dans server.js
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connecté: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Erreur de connexion MongoDB: ${error.message}`);
    process.exit(1); // pas de DB, pas d'app qui tourne, autant crash direct
  }
};

export default connectDB;
