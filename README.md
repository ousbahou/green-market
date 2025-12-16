# green-market

GreenMarket Orders expose une API Node.js/Express pour la logistique (auth, produits, commandes) avec MySQL, JWT et Swagger. Ce dépôt contient le serveur et la configuration nécessaire pour lancer l’ensemble avec Docker Compose.

## Stack principale
- Node.js 20 (API)
- MySQL 8.0
- Docker + Docker Compose (recommandé pour la reproductibilité)

## Prérequis pour le démarrage instantané
1. Docker Desktop (ou la CLI Docker) avec Docker Compose activé.
2. (Optionnel) Si vous voulez personnaliser les secrets, copiez le fichier d’exemple d’environnements dans le dossier `server` :
	```powershell
	copy server\.env.example server\.env
	```
	(ou `cp server/.env.example server/.env` sur Linux/macOS). Docker Compose charge par défaut `server/.env.example`, donc cette étape n’est pas requise pour lancer la stack.

## Démarrage avec Docker Compose (recommandé)
1. Depuis la racine, construire et lancer les services :
	```bash
	docker compose up --build
	```
2. L’API est accessible sur `http://localhost:3001/api/v1` et Swagger sur `http://localhost:3001/api-docs`.
3. La base de données MySQL écoute sur le port 3306 avec l’utilisateur `root` et le mot de passe `secret` (défini dans `docker-compose.yml`).
4. Pour arrêter et nettoyer les volumes :
	```bash
	docker compose down
	```
5. Pour forcer la recréation du schéma si vous avez déjà démarré la stack et que MySQL était vide, faites un `docker compose down -v` avant de remonter l’environnement ; le script `server/db/init.sql` crée les tables (`users`, `products`, `orders`, `order_lines`) et insère un admin `admin@greenmarket.local` / `Admin@1234` ainsi qu’un produit de démonstration.

## Pourquoi Docker Compose ?
- **Reproductibilité parfaite** : une seule commande monte l’ensemble (API + base) avec les mêmes variables d’environnement et volumes persistants ; le jury ou un nouvel équipier n’a rien à configurer.
- **Isolé** : la base de données n’affecte pas les instances locales en dehors de Docker.
- **Prêt pour CI/CD** : `docker-compose` peut être repris dans les pipelines pour la validation d’intégration.

## Exécution locale sans Docker
1. Installez les dépendances dans `server/` :
	```bash
	cd server
	npm install
	```
2. Créez `server/.env` (voir `server/.env.example`).
3. Démarrez un MySQL local (port 3306, utilisateur `root`, mot de passe `secret`).
4. Lancez l’API :
	```bash
	npm start
	```

## Accès à la base (Compose)
Une fois `docker compose up` lancé, MySQL est joignable par `root`/`secret` via `localhost:3306`, ce qui facilite l’exécution de requêtes SQL, les migrations ou les tests manuels de données.
### Notes Docker Compose
 Le fichier `server/db/init.sql` est injecté dans `/docker-entrypoint-initdb.d/` pour créer et peupler `users`, `products`, `orders`, `order_lines` lors de la première initialisation (admin `admin@greenmarket.local` / `Admin@1234`, produit `GM-001`).
 L’API relit `server/db/init.sql` via `server/db/initSchema.js` après avoir établi la connexion pour recréer les objets manquants si le volume a été supprimé, et pour patienter tant que MySQL n’est pas responsive.
 Les variables d’environnement définies dans `server/.env.example` sont automatiquement chargées par Docker Compose (fonctionnement identique à un `.env`). Copiez le fichier seulement si vous voulez personnaliser vos secrets avant de démarrer la stack.
 L’API répète maintenant les tentatives de connexion à MySQL au démarrage (`DB_INIT_RETRIES` / `DB_INIT_DELAY` dans `.env`), ce qui garantit qu’elle attendra suffisamment longtemps le conteneur `db` lancé par `docker compose up`.