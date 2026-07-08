# Medical Certification — Gestion des certificats médicaux des pilotes

Application web pour la gestion du cycle de vie complet des certificats médicaux des pilotes (classes 1 à 4) : dossiers pilotes, génération de certificats, suivi automatique des statuts, traçabilité complète des actions, et gestion des comptes administrateurs. Stack React + Vite côté client, Express + MongoDB côté serveur.

## 🎯 Fonctionnalités

- **Authentification sécurisée** : login par email/mot de passe, session JWT, gestion des rôles `admin` / `superadmin`.
- **Gestion des pilotes** : création, modification, archivage/restauration, renouvellement, suppression, recherche multicritère, filtres, pagination.
- **Certificats médicaux** : génération selon deux modèles réglementaires (Pdf1/Pdf2), export PDF (jsPDF + html2canvas), consultation par pilote.
- **Suivi automatique des statuts** : recalcul `actif` / `expirant` (≤30j) / `expiré` à chaque consultation.
- **Historique (audit trail)** : traçabilité de toute action sur un pilote ou un compte admin (qui, quand, avant/après).
- **Gestion des administrateurs** (super-admin) : création, modification, suppression, réinitialisation de mot de passe.
- **Tableau de bord** : indicateurs consolidés (pilotes, certificats actifs/expirants/expirés, activité récente).
- **Notifications** : alerte visuelle sur les certificats expirés ou expirant bientôt.
- **Thème clair/sombre**, interface responsive.

## 🚀 Démarrage rapide

### Prérequis
- Node.js v18+
- MongoDB (local ou Atlas)

### Installation

1. **Frontend :**
```bash
npm install
```

2. **Backend :**
```bash
cd backend
npm install
cd ..
```

3. **Configuration :** créer `backend/.env` (voir [Variables d'environnement](#-variables-denvironnement)).

4. **Lancement :**
```bash
# Terminal 1 - Backend (port 5000)
cd backend && npm run dev

# Terminal 2 - Frontend (port 5173)
npm run dev
```

Accédez à `http://localhost:5173`.

> ⚠️ Le premier compte `superadmin` (seul habilité à créer des comptes admin via `/api/auth/register`) doit être créé manuellement en base — il n'existe pas encore de script de seed automatisé.

## 📁 Structure du projet

```
dashboard-app/
├── backend/
│   ├── server.js                → point d'entrée : connexion MongoDB + démarrage HTTP
│   ├── app.js                   → configuration Express (middlewares, montage des routes)
│   ├── db.js                    → connexion MongoDB (Mongoose)
│   ├── User.js                  → modèle des comptes (admin/superadmin)
│   ├── authController.js / authRoutes.js / authMiddleware.js
│   ├── models/                  → Pilot, Certificate, PilotHistory, AdminHistory
│   ├── controllers/              → gèrent req/res, délèguent aux services
│   ├── services/                 → logique métier (statuts, historisation, validation)
│   ├── routes/                   → endpoints + middlewares de protection par rôle
│   ├── utils/validation.js       → règles de validation des entrées
│   ├── scripts/                  → scripts ponctuels (ex: migration d'historique)
│   └── tests/, *.test.js         → tests Vitest + Supertest
│
├── src/
│   ├── pages/                    → Login, Register, Dashboard, Pilots, Certificates,
│   │                               History, AdminManagement, AdminHistory, Profile
│   ├── components/                → Sidebar, NavbarUser, NotificationBell, Pdf1, Pdf2,
│   │                               Toast, ConfirmDialog, ChangePasswordModal, Footer, ThemeToggle
│   ├── context/                   → ThemeContext, ToastContext
│   ├── utils/                     → wrappers d'appel API (pilots, certificates, historique...)
│   └── tests/, *.test.jsx        → tests Vitest + React Testing Library
│
├── package.json                  → dépendances et scripts frontend
└── vitest.config.js / vite.config.js
```

## 📋 API Routes

| Ressource | Méthode | Endpoint | Accès |
|---|---|---|---|
| Auth | POST | `/api/auth/login` | Public |
| Auth | POST | `/api/auth/register` | Super-admin |
| Auth | GET | `/api/auth/me` | Authentifié |
| Auth | PUT | `/api/auth/me` | Authentifié |
| Auth | PUT | `/api/auth/change-password` | Authentifié |
| Auth | GET/PUT/DELETE | `/api/auth/admins[/:id]` | Super-admin |
| Auth | PUT | `/api/auth/admins/:id/reset-password` | Super-admin |
| Pilotes | GET/POST | `/api/pilots` | Authentifié |
| Pilotes | GET/PUT/DELETE | `/api/pilots/:id` | Authentifié |
| Pilotes | PATCH | `/api/pilots/:id/renew` \| `/archive` \| `/restore` | Authentifié |
| Certificats | GET/POST | `/api/certificates` | Authentifié |
| Certificats | GET | `/api/certificates/:id` \| `/pilot/:pilotId` | Authentifié |
| Historique pilotes | GET | `/api/pilot-history[/:id]` | Authentifié |
| Historique admins | GET | `/api/admin-history` | Super-admin |
| Dashboard | GET | `/api/dashboard/stats` | Authentifié |

## 🔒 Sécurité

- Mots de passe hashés avec `bcryptjs` (jamais retournés par défaut, `select: false`).
- Authentification par JWT signé (`JWT_SECRET`), vérifié par le middleware `protect`.
- Contrôle d'accès par rôle (`isSuperAdmin`) sur les routes sensibles.
- Validation des entrées côté serveur, indépendante du frontend.
- En-têtes HTTP de sécurité via `helmet` (CSP, anti-clickjacking, etc.).
- CORS restreint à l'origine du frontend (`FRONTEND_URL`).
- Limitation du taux de connexion (`express-rate-limit`) : 10 tentatives / 15 min sur `/api/auth/login`.
- Traçabilité systématique de toute mutation de données sensibles.

## 🧪 Tests

```bash
# Frontend (Vitest + React Testing Library)
npm test

# Backend (Vitest + Supertest, contre une base MongoDB de test dédiée)
cd backend && npm test
```

Les tests backend utilisent une base MongoDB locale séparée (`dashboard-app-test`, voir `backend/tests/dbHelper.js`), réinitialisée entre chaque test.

## 🛠️ Commandes

### Frontend
```bash
npm run dev       # Serveur de développement
npm run build     # Build de production
npm run preview   # Prévisualiser la build
npm run lint      # Linter
npm test          # Tests
```

### Backend
```bash
npm start         # Lancer le serveur
npm run dev       # Mode développement (hot-reload)
npm test          # Tests
```

## 📦 Dépendances principales

### Frontend
- **react** / **react-router-dom** — UI et routage
- **axios** — client HTTP
- **framer-motion** — animations
- **lucide-react** — icônes
- **recharts** — graphiques du tableau de bord
- **jspdf** / **html2canvas** — génération/export PDF des certificats
- **vite** — build tool
- **vitest** / **@testing-library/react** — tests

### Backend
- **express** / **mongoose** — API REST et ODM MongoDB
- **bcryptjs** / **jsonwebtoken** — hash et JWT
- **helmet** / **cors** / **express-rate-limit** — sécurité HTTP
- **vitest** / **supertest** — tests

## 🔧 Variables d'environnement

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dashboard-app
JWT_SECRET=change_moi_en_production
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (`.env.local`, optionnel)
```env
VITE_API_URL=http://localhost:5000/api
```

## 📝 Notes

- Backend en ES Modules (`"type": "module"`).
- Les tokens JWT expirent après 30 jours (pas de refresh token pour l'instant).
- Architecture backend en couches : Route → Contrôleur → Service → Modèle.

## 📄 License

MIT
