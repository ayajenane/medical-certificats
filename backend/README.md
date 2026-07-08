# Backend — Medical Certification

API Node.js/Express + MongoDB pour la plateforme de gestion des certificats médicaux des pilotes : authentification, gestion des pilotes, des certificats, de l'historique (audit trail) et des comptes administrateurs.

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env` à la racine de `backend/` :

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dashboard-app
JWT_SECRET=change_moi_en_production
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

S'assurer que MongoDB tourne localement, ou remplacer `MONGODB_URI` par une URL MongoDB Atlas.

> Le premier compte `superadmin` (seul habilité à créer des comptes admin) doit être créé manuellement en base — aucun script de seed automatisé n'existe actuellement.

## Démarrage

```bash
npm run dev     # mode développement, redémarre automatiquement (node --watch)
npm start       # mode production
```

Le serveur écoute sur `http://localhost:5000`.

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
├── utils/validation.js             # règles de validation des entrées
├── scripts/                        # scripts ponctuels (ex: migration d'historique admin)
├── tests/dbHelper.js               # connexion à la base MongoDB de test
├── *.test.js                       # tests unitaires/intégration colocalisés
└── .env                            # variables d'environnement
```

## Sécurité

- Mots de passe hashés avec `bcryptjs` (salt 10 tours), jamais retournés par défaut (`select: false`).
- Authentification par JWT signé (`JWT_SECRET`), expiration 30 jours, vérifié par le middleware `protect`.
- Contrôle d'accès par rôle (`isSuperAdmin`) sur les routes de gestion des comptes admin.
- Validation des données côté serveur (`utils/validation.js`), indépendante du frontend.
- En-têtes HTTP de sécurité via `helmet` (CSP, anti-clickjacking, anti-sniffing MIME...).
- CORS restreint à l'origine du frontend (`FRONTEND_URL`), au lieu d'un `cors()` ouvert.
- Limitation du taux de connexion (`express-rate-limit`) : 10 tentatives max / 15 min sur `/api/auth/login`, anti brute-force.
- Traçabilité systématique : toute mutation d'un pilote ou d'un compte admin génère une entrée d'historique.
