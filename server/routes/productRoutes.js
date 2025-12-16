import { Router } from "express";
import {
	getAllProducts,
	createProduct,
	updateProductStock,
	updateProduct,
	deleteProduct,
} from "../controllers/productController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Gestion des produits
 */

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Récupérer tous les produits
 *     tags: [Products]
 *     description: "Rôles autorisés : ADMIN, LOGISTICS, CUSTOMER_SERVICE"
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des produits
 *       401:
 *         description: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 */
router.get("/", authenticate, authorizeRoles("ADMIN", "LOGISTICS", "CUSTOMER_SERVICE"), getAllProducts);

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Créer un produit
 *     tags: [Products]
 *     description: "Rôles autorisés : ADMIN, LOGISTICS"
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sku, name]
 *             properties:
 *               sku:
 *                 type: string
 *               name:
 *                 type: string
 *               stock_quantity:
 *                 type: integer
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Produit créé
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Token manquant ou invalide
 *       409:
 *         description: SKU déjà utilisé
 *       500:
 *         description: Erreur serveur
 */
router.post("/", authenticate, authorizeRoles("ADMIN", "LOGISTICS"), createProduct);

/**
 * @swagger
 * /api/v1/products/{id}/stock:
 *   patch:
 *     summary: Mettre à jour le stock d'un produit
 *     tags: [Products]
 *     description: "Rôles autorisés : ADMIN, LOGISTICS"
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du produit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stock_quantity]
 *             properties:
 *               stock_quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Stock mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Produit introuvable
 *       500:
 *         description: Erreur serveur
 */
router.patch("/:id/stock", authenticate, authorizeRoles("ADMIN", "LOGISTICS"), updateProductStock);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   patch:
 *     summary: Mettre à jour un produit (nom/sku/prix)
 *     tags: [Products]
 *     description: "Rôles autorisés : ADMIN, LOGISTICS"
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du produit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               sku:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Produit mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Produit introuvable
 *       409:
 *         description: SKU déjà utilisé
 *       500:
 *         description: Erreur serveur
 */
router.patch("/:id", authenticate, authorizeRoles("ADMIN", "LOGISTICS"), updateProduct);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Supprimer un produit
 *     tags: [Products]
 *     description: "Rôles autorisés : ADMIN"
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du produit
 *     responses:
 *       200:
 *         description: Produit supprimé
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Produit introuvable
 *       500:
 *         description: Erreur serveur
 */
router.delete("/:id", authenticate, authorizeRoles("ADMIN"), deleteProduct);

export default router;
