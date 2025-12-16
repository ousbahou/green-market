# GreenMarket Orders API

> Préférez `docker compose up --build` depuis la racine (`docker-compose.yml`) pour obtenir un conteneur MySQL configuré et l’API prête à répondre sans installer MySQL localement.

API REST Node.js/Express pour la logistique GreenMarket (auth, produits, commandes) avec MySQL, JWT, Swagger, rôles.

## Stack
- Node.js / Express
- MySQL (mysql2/promise)
- Authentification : JWT + bcryptjs
- Swagger : swagger-ui-express + swagger-jsdoc
- CORS, dotenv

## Prérequis
- Node.js (>= 18 recommandé)
- MySQL/MariaDB accessible (ou lancer la stack Docker Compose)

## Installation
```bash
npm install
```

## Configuration
Créez un fichier `.env` (ou copiez `.env.example`) :
```
PORT=3001
BASE_URL=http://localhost:3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=gm_user
DB_PASSWORD=motdepasseSolide!
DB_NAME=greenmarket
DB_CONN_LIMIT=10
JWT_SECRET=supersecretjwt
JWT_EXPIRES_IN=1h
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=mailer@example.com
SMTP_PASS=motdepasseSMTP
MAIL_FROM="GreenMarket <mailer@example.com>"
MAIL_DEFAULT_TO=ops@example.com
```

## Base de données (schéma)
Tables : users, products, orders, order_lines.

## Démarrage
- Dev (watch) :
```bash
npm run dev
```
- Prod :
```bash
npm start
```

### Notes Docker Compose
- L’API répète maintenant les tentatives de connexion à MySQL au démarrage (`DB_INIT_RETRIES` / `DB_INIT_DELAY` dans `.env`), ce qui garantit qu’elle attendra suffisamment longtemps le conteneur `db` lancé par `docker compose up`.
- Le script `server/db/init.sql` est monté sous `/docker-entrypoint-initdb.d/` : il crée la structure (`users`, `products`, `orders`, `order_lines`) et les données de base (admin `admin@greenmarket.local` / `Admin@1234`, produit `GM-001`); `server/db/initSchema.js` relit ce fichier après chaque connexion pour recréer les objets manquants et générer un admin-token dès qu’on démarre sans table.
- Les variables d’environnement définies dans `server/.env.example` sont automatiquement chargées par Docker Compose (fonctionnement identique à un `.env`). Copiez le fichier seulement si vous voulez personnaliser vos secrets avant de démarrer la stack.

Healthcheck : http://localhost:3001/api/v1/health
Swagger UI : http://localhost:3001/api-docs

## Rôles et droits
- **ADMIN** : création de comptes, accès complet (produits, commandes, utilisateurs). Protection cruciale pour `POST /api/v1/auth/register`.
- **LOGISTICS** : lecture/écriture commandes (création, statut/tracking), mise à jour stock produits, lecture produits.
- **CUSTOMER_SERVICE** : lecture commandes et produits uniquement.

> Pour amorcer, créez un premier utilisateur ADMIN via SQL directement dans la base, puis utilisez `POST /api/v1/auth/login` pour obtenir un token.

## Endpoints principaux (v1)
- Auth :
	- POST /api/v1/auth/register (ADMIN)
	- POST /api/v1/auth/login
- Products :
	- GET /api/v1/products (ADMIN, LOGISTICS, CUSTOMER_SERVICE)
	- POST /api/v1/products (ADMIN, LOGISTICS)
	- PATCH /api/v1/products/{id} (ADMIN, LOGISTICS)
	- PATCH /api/v1/products/{id}/stock (ADMIN, LOGISTICS)
	- DELETE /api/v1/products/{id} (ADMIN)
- Orders :
	- GET /api/v1/orders (ADMIN, LOGISTICS, CUSTOMER_SERVICE)
	- GET /api/v1/orders/{id} (ADMIN, LOGISTICS, CUSTOMER_SERVICE)
	- POST /api/v1/orders (ADMIN, LOGISTICS)
	- PATCH /api/v1/orders/{id} (ADMIN, LOGISTICS)
	- DELETE /api/v1/orders/{id} (ADMIN)

## Notifications email
- Facultatif : configurez les variables SMTP_* + MAIL_FROM (+ MAIL_DEFAULT_TO) pour activer l’envoi.
- Création commande : envoi à `customer_email` fourni dans le body (fallback `MAIL_DEFAULT_TO`).
- Mise à jour commande : envoi à `notify_email` fourni (fallback `MAIL_DEFAULT_TO`).
- Les emails sont best-effort : un échec n’empêche pas la réponse API.

