import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.js";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../controllers/orderController.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Gestion des commandes
 */

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Lister toutes les commandes
 *     tags: [Orders]
 *     description: "Rôles autorisés : ADMIN, LOGISTICS, CUSTOMER_SERVICE"
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des commandes
 *       401:
 *         description: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 */
router.get("/", authenticate, authorizeRoles("ADMIN", "LOGISTICS", "CUSTOMER_SERVICE"), getOrders);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Récupérer une commande avec ses lignes
 *     tags: [Orders]
 *     description: "Rôles autorisés : ADMIN, LOGISTICS, CUSTOMER_SERVICE"
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la commande
 *     responses:
 *       200:
 *         description: Commande trouvée
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Commande introuvable
 *       500:
 *         description: Erreur serveur
 */
router.get("/:id", authenticate, authorizeRoles("ADMIN", "LOGISTICS", "CUSTOMER_SERVICE"), getOrderById);

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Créer une commande avec ses lignes
 *     tags: [Orders]
 *     description: "Rôles autorisés : ADMIN, LOGISTICS"
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [external_reference, lines]
 *             properties:
 *               external_reference:
 *                 type: string
 *               customer_name:
 *                 type: string
 *               status:
 *                 type: string
 *                 default: PENDING
 *               customer_email:
 *                 type: string
 *               tracking_number:
 *                 type: string
 *               lines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [product_id, quantity]
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Commande créée
 *       400:
 *         description: Données manquantes/invalides
 *       401:
 *         description: Token manquant ou invalide
 *       409:
 *         description: Référence externe déjà utilisée
 *       500:
 *         description: Erreur serveur
 */
router.post("/", authenticate, authorizeRoles("ADMIN", "LOGISTICS"), createOrder);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   patch:
 *     summary: Mettre à jour le statut ou le tracking d'une commande
 *     tags: [Orders]
 *     description: "Rôles autorisés : ADMIN, LOGISTICS"
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la commande
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               tracking_number:
 *                 type: string
 *               notify_email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Commande mise à jour
 *       400:
 *         description: Données manquantes
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Commande introuvable
 *       500:
 *         description: Erreur serveur
 */
router.patch("/:id", authenticate, authorizeRoles("ADMIN", "LOGISTICS"), updateOrder);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   delete:
 *     summary: Supprimer une commande
 *     tags: [Orders]
 *     description: "Rôles autorisés : ADMIN"
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la commande
 *     responses:
 *       200:
 *         description: Commande supprimée
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Commande introuvable
 *       500:
 *         description: Erreur serveur
 */
router.delete("/:id", authenticate, authorizeRoles("ADMIN"), deleteOrder);

export default router;
