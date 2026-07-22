# Backend — Medical Certification

API Node.js/Express + MongoDB pour la plateforme de gestion des certificats médicaux des pilotes : authentification, gestion des pilotes, des certificats, de l'historique (audit trail) et des comptes administrateurs.

## Installation

```bash
npm install
```

## Configuration

Copier `.env.example` vers `.env` à la racine de `backend/` et compléter les valeurs :

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dashboard-app
JWT_SECRET=
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_EMAIL=superadmin@dgac.ma
SUPER_ADMIN_PASSWORD=
```

S'assurer que MongoDB tourne localement, ou remplacer `MONGODB_URI` par une URL MongoDB Atlas.

`JWT_SECRET` doit être une valeur forte et unique par environnement (le serveur refuse de démarrer si elle est absente ou laissée à une valeur par défaut connue) :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Démarrage

```bash
npm run dev     # mode développement, redémarre automatiquement (node --watch)
npm start       # mode production
```

Le serveur écoute sur `http://localhost:5000`.

Créer le premier compte `superadmin` (seul habilité à créer des comptes admin) à partir des variables `SUPER_ADMIN_*` du `.env` :

```bash
npm run seed:admin
```

Le script est idempotent : il ne fait rien si un superadmin existe déjà en base.

## Tests

```bash
npm test
```

Exécute la suite Vitest + Supertest contre une base MongoDB locale **dédiée aux tests** (`dashboard-app-test`, distincte de la base de développement — voir `tests/dbHelper.js`), réinitialisée entre chaque test. Les fichiers de test sont colocalisés avec le code qu'ils couvrent (`*.test.js`).

Couverture actuelle : validation des entrées, statuts et CRUD des pilotes, création/renouvellement de certificats, historique (ajout/filtres), statistiques du tableau de bord, modèle `User` (hash du mot de passe), routes d'authentification (login, contrôle d'accès super-admin, limitation du taux de connexion).

## Routes API

### Authentification (`/api/auth`)

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/login` | Public | Connexion, retourne un JWT |
| POST | `/register` | Super-admin | Créer un compte admin |
| GET | `/me` | Authentifié | Infos de l'utilisateur connecté |
| PUT | `/me` | Authentifié | Modifier son propre profil |
| PUT | `/change-password` | Authentifié | Changer son mot de passe |
| GET | `/admins` | Super-admin | Lister les comptes admin |
| PUT | `/admins/:id` | Super-admin | Modifier un compte admin |
| DELETE | `/admins/:id` | Super-admin | Supprimer un compte admin |
| PUT | `/admins/:id/reset-password` | Super-admin | Réinitialiser le mot de passe d'un admin |

### Pilotes (`/api/pilots`)

| Méthode | Route | Description |
|---|---|---|
| GET | `/` | Liste (recherche, filtres, tri, pagination) |
| POST | `/` | Créer un pilote |
| GET | `/:id` | Détail d'un pilote |
| PUT | `/:id` | Modifier un pilote |
| DELETE | `/:id` | Supprimer définitivement |
| PATCH | `/:id/renew` | Renouveler (nouvelle date d'expiration) |
| PATCH | `/:id/archive` | Archiver |
| PATCH | `/:id/restore` | Restaurer |

### Certificats (`/api/certificates`)

| Méthode | Route | Description |
|---|---|---|
| GET | `/` | Liste (filtres, recherche, pagination) |
| POST | `/` | Générer un certificat (met à jour le pilote associé) |
| GET | `/:id` | Détail d'un certificat |
| GET | `/pilot/:pilotId` | Certificats d'un pilote donné |

### Historique

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/api/pilot-history` | Authentifié | Historique des actions sur les pilotes |
| GET | `/api/pilot-history/:id` | Authentifié | Détail d'une entrée d'historique |
| GET | `/api/admin-history` | Super-admin | Historique des actions sur les comptes admin |

### Tableau de bord

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Indicateurs consolidés (pilotes, certificats, activité récente) |

Toutes les routes protégées attendent un header `Authorization: Bearer <token>`.

## Structure

```
backend/
├── server.js                      # point d'entrée : connexion DB + démarrage HTTP
├── app.js                         # config Express (middlewares, montage des routes)
├── db.js                          # connexion MongoDB
├── User.js                        # modèle des comptes (admin/superadmin)
├── authController.js / authRoutes.js / authMiddleware.js
├── models/                        # Pilot, Certificate, PilotHistory, AdminHistory
├── controllers/                    # req/res, délèguent aux services
├── services/                       # logique métier (statuts, historisation, validation)
├── routes/                         # endpoints + middlewares de protection
├── middleware/                     # errorHandler (centralisé), rateLimiter (login, actions sensibles, global)
├── utils/validation.js             # règles de validation des entrées
├── scripts/                        # scripts ponctuels (seed du superadmin, migration d'historique admin)
├── tests/dbHelper.js               # connexion à la base MongoDB de test
├── *.test.js                       # tests unitaires/intégration colocalisés
└── .env                            # variables d'environnement
```

## Sécurité

- Mots de passe hashés avec `bcryptjs` (salt 10 tours), jamais retournés par défaut (`select: false`).
- Authentification par JWT signé (`JWT_SECRET`), expiration 30 jours, vérifié par le middleware `protect`.
- Le serveur refuse de démarrer si `JWT_SECRET` est absent ou laissé à sa valeur par défaut connue (voir `server.js`).
- Contrôle d'accès par rôle (`isSuperAdmin`) sur les routes de gestion des comptes admin.
- Validation des données côté serveur (`utils/validation.js`), indépendante du frontend.
- En-têtes HTTP de sécurité via `helmet` (CSP, anti-clickjacking, anti-sniffing MIME...).
- CORS restreint à l'origine du frontend (`FRONTEND_URL`), au lieu d'un `cors()` ouvert.
- Limitation de débit (`express-rate-limit`, voir `middleware/rateLimiter.js`) :
  - `/api/auth/login` : 10 tentatives / 15 min (anti brute-force).
  - Actions sensibles sur les comptes (`register`, `reset-password`, `change-password`) : 20 / 15 min.
  - Toute l'API (`/api/*`) : 300 requêtes / 15 min par IP, filet de sécurité général.
- Gestion d'erreur centralisée (`middleware/errorHandler.js`) : les erreurs internes (500) ne renvoient jamais le message brut au client, seulement un message générique (le détail est loggé côté serveur).
- Traçabilité systématique : toute mutation d'un pilote ou d'un compte admin génère une entrée d'historique.
