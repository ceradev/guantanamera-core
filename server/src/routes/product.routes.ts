import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import { apiKeyMiddleware } from "../middlewares/apiKey.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createProductSchema, updateProductSchema, productActiveSchema } from "../validators/product.schema.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The product ID
 *           example: 1
 *         name:
 *           type: string
 *           description: The product name
 *           example: "Pollo Asado"
 *         price:
 *           type: number
 *           description: The product price
 *           example: 12.50
 *         description:
 *           type: string
 *           description: The product description
 *           example: "Pollo asado con papas"
 *         active:
 *           type: boolean
 *           description: Whether the product is active
 *           example: true
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The category ID
 *           example: 1
 *         name:
 *           type: string
 *           description: The category name
 *           example: "Platos Principales"
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all active products grouped by category
 *     description: Retrieve a list of all active categories containing their active products.
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of categories with their active products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 * */
router.get("/products", apiKeyMiddleware, productController.getMenu);

/**
 * @swagger
 * /products/all:
 *   get:
 *     summary: Get all products (active and inactive) grouped by category
 *     description: Retrieve a list of all categories containing all their products. Requires API Key.
 *     tags: [Products]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of categories with all products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/products/all", apiKeyMiddleware, productController.getAdminMenu);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product in a category. Requires API Key.
 *     tags: [Products]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               categoryId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/products", apiKeyMiddleware, validate(createProductSchema), productController.createProduct);

/**
 * @swagger
 * /products/inactive-names:
 *   get:
 *     summary: Get names of inactive products
 *     description: Returns a simple list of product names that are currently inactive. Public endpoint.
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of inactive product names
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       500:
 *         description: Internal server error
 */
router.get("/products/inactive-names", productController.getInactiveProductNames);

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Update a product
 *     description: Update product price, name, or active status. Requires API Key.
 *     tags: [Products]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               active:
 *                 type: boolean
 *               categoryId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch("/products/:id", apiKeyMiddleware, validate(updateProductSchema), productController.updateProduct);

/**
 * @swagger
 * /products/{id}/active:
 *   patch:
 *     summary: Enable or disable a product
 *     description: Toggle active state of a product. Requires API Key.
 *     tags: [Products]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               active:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Product active state updated
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch("/products/:id/active", apiKeyMiddleware, validate(productActiveSchema), productController.updateProductActive);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     description: Permanently delete a product. Requires API Key.
 *     tags: [Products]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete("/products/:id", apiKeyMiddleware, productController.deleteProduct);

export default router;
