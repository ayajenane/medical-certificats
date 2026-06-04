# Dashboard App - React + Vite + Node.js Backend

Une application de dashboard avec authentification sécurisée utilisant React, Vite, Express et MongoDB.

## 🎯 Fonctionnalités

- **Authentification Sécurisée**: Registration et login avec JWT
- **Base de Données**: MongoDB pour stocker les utilisateurs
- **Hash Sécurisé**: Mots de passe hashés avec bcryptjs
- **API RESTful**: Backend Express avec routes protégées
- **Frontend Moderne**: React avec Vite pour une expérience rapide

## 🚀 Démarrage Rapide

### Prérequis
- Node.js v16+
- MongoDB (local ou Atlas)

### Installation

1. **Clone et installation frontend:**
```bash
npm install
```

2. **Installation backend:**
```bash
cd backend
npm install
cd ..
```

3. **Configuration:**
   - Créer `backend/.env` avec vos paramètres MongoDB
   - Créer `.env.local` avec l'URL de l'API

4. **Lancement:**
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
npm run dev
```

Accédez à `http://localhost:5173`

## 📁 Structure du Projet

```
dashboard-app/
├── backend/                    # API Express + MongoDB
│   ├── server.js              # Point d'entrée
│   ├── db.js                  # Config MongoDB
│   ├── User.js                # Modèle Mongoose
│   ├── authController.js      # Logique d'auth
│   ├── authMiddleware.js      # Middleware JWT
│   ├── authRoutes.js          # Routes API
│   └── .env                   # Variables d'env
│
├── src/                       # Code React
│   ├── pages/
│   │   ├── Login.jsx         # Connexion
│   │   ├── Register.jsx      # Inscription
│   │   └── Dashboard.jsx     # Tableau de bord
│   ├── utils/
│   │   └── api.js            # Client Axios
│   └── App.jsx               # Routeur principal
│
├── package.json              # Dépendances frontend
└── vite.config.js            # Configuration Vite
```

## 🔐 Authentification

### Flux d'Inscription
1. Remplir le formulaire d'inscription
2. Backend valide et hash le mot de passe
3. Utilisateur créé dans MongoDB
4. Redirection vers la connexion

### Flux de Connexion
1. Entrer email et mot de passe
2. Backend vérifie les identifiants
3. JWT généré et retourné
4. Token stocké dans localStorage
5. Redirection vers le dashboard


## 🛠️ Commandes

### Frontend
```bash
npm run dev       # Lancer le serveur de développement
npm run build     # Construire pour production
npm run preview   # Prévisualiser la build
npm run lint      # Vérifier le code
```

### Backend
```bash
npm start         # Lancer le serveur
npm run dev       # Mode développement avec hot-reload
```

## 📋 API Routes

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Créer un compte |
| POST | `/api/auth/login` | Se connecter |
| GET | `/api/auth/me` | Récupérer l'utilisateur (protégé) |

## 🔒 Sécurité

- ✅ Mots de passe hashés avec bcryptjs
- ✅ JWT pour l'authentification stateless
- ✅ Validation server-side
- ✅ CORS configuré
- ✅ Tokens avec expiration

## 📦 Dépendances Principales

### Frontend
- **react** - Framework UI
- **react-router-dom** - Routage
- **axios** - Client HTTP
- **vite** - Build tool

### Backend
- **express** - Framework web
- **mongoose** - ORM MongoDB
- **bcryptjs** - Hash de mots de passe
- **jsonwebtoken** - JWT
- **cors** - CORS middleware

## 🔧 Variables d'Environnement

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dashboard-app
JWT_SECRET=your_secret_key
NODE_ENV=development
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:5000/api
```

## ⚠️ Avant Production

- [ ] Changer `JWT_SECRET`
- [ ] Utiliser MongoDB Atlas
- [ ] Configurer les URLs correctes
- [ ] Activer HTTPS
- [ ] Configurer les headers de sécurité
- [ ] Ajouter les validations supplémentaires

## 📝 Notes

- Le backend utilise ES Modules (`type: "module"` dans package.json)
- Les tokens JWT expirent après 30 jours
- Les utilisateurs sont stockés avec email unique
- Le système de routes protégées utilise le middleware JWT

## 🤝 Contribution

Les contributions sont bienvenues! N'hésitez pas à proposer des améliorations.

## 📄 License

MIT

