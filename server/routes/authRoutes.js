import { Router } from "express";
import { register, login } from "../controllers/authController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Gestion de l'authentification
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Inscription d'un utilisateur
 *     tags: [Auth]
 *     description: Réservé au rôle ADMIN
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 default: LOGISTICS
 *     responses:
 *       201:
 *         description: Utilisateur créé
 *       400:
 *         description: Données manquantes
 *       409:
 *         description: Utilisateur déjà existant
 *       500:
 *         description: Erreur serveur
 */
router.post("/register", authenticate, authorizeRoles("ADMIN"), register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       400:
 *         description: Données manquantes
 *       401:
 *         description: Identifiants invalides
 *       500:
 *         description: Erreur serveur
 */
router.post("/login", login);

export default router;
