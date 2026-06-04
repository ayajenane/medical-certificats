# Backend - Dashboard App

Backend Node.js/Express pour l'authentification du Dashboard App.

## Installation

```bash
npm install
```

## Configuration

1. Créer un fichier `.env` à la racine du projet backend avec:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dashboard-app
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
```

2. S'assurer que MongoDB est en cours d'exécution localement ou mettre à jour `MONGODB_URI` avec votre URL MongoDB Atlas.

## Démarrage

### Mode développement
```bash
npm run dev
```

### Mode production
```bash
npm start
```

Le serveur sera accessible sur `http://localhost:5000`

## Routes API

### Authentification

- **POST** `/api/auth/register` - Enregistrer un nouvel utilisateur
  - Body: `{ username, email, password, confirmPassword }`
  - Retourne: `{ success, message, token, user }`

- **POST** `/api/auth/login` - Connecter un utilisateur
  - Body: `{ email, password }`
  - Retourne: `{ success, message, token, user }`

- **GET** `/api/auth/me` - Récupérer les infos de l'utilisateur connecté (Protégé)
  - Headers: `Authorization: Bearer <token>`
  - Retourne: `{ success, data: user }`

## Structure

```
backend/
├── server.js              # Serveur principal
├── package.json           # Dépendances
├── .env                   # Variables d'environnement
├── db.js                  # Configuration MongoDB
├── User.js                # Modèle User Mongoose
├── authController.js      # Logique d'authentification
├── authMiddleware.js      # Middleware JWT
├── authRoutes.js          # Routes d'authentification
└── .gitignore             # Fichiers à ignorer
```

## Sécurité

- Mots de passe hashés avec bcryptjs
- Tokens JWT avec expiration 30 jours
- Validation des données côté serveur
- CORS activé pour accepter les requêtes du frontend
