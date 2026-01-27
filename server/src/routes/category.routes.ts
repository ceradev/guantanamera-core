import { Router } from "express";
import * as categoryController from "../controllers/category.controller.js";
import { apiKeyMiddleware } from "../middlewares/apiKey.middleware.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CategoryResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Bebidas"
 *         productCount:
 *           type: integer
 *           example: 10
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all active categories with product count
 *     description: Retrieve a list of all active categories and the count of active products in each.
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategoryResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 * */
router.get("/categories", apiKeyMiddleware, categoryController.getCategories);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     description: Create a new active category. Requires API Key.
 *     tags: [Categories]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Postres"
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Name is required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/categories", apiKeyMiddleware, categoryController.createCategory);

export default router;
