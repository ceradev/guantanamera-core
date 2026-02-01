import { Router } from "express";
import * as salesController from "../controllers/sales.controller.js";
import { apiKeyMiddleware } from "../middlewares/apiKey.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { salesQuerySchema } from "../validators/sales.schema.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Endpoints de ventas calculadas dinámicamente
 */

/**
 * @swagger
 * /sales/today:
  *   get:
 *     summary: Obtener ventas del día (DELIVERED, hoy por createdAt)
 *     description: Calcula ventas del día en tiempo real sin persistencia.
 *     tags: [Sales]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Resumen de ventas del día
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                   example: "2025-01-01"
 *                 totalRevenue:
 *                   type: number
 *                   example: 245.50
 *                 totalOrders:
 *                   type: integer
 *                   example: 18
 *                 averageOrderValue:
 *                   type: number
 *                   example: 13.64
 *                 topProducts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productId:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Pollo asado"
 *                       quantity:
 *                         type: integer
 *                         example: 12
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/sales/today", apiKeyMiddleware, salesController.getToday);

/**
 * @swagger
 * /sales:
 *   get:
 *     summary: Obtener ventas agregadas por día, semana o mes
 *     description: Devuelve totales agregados (DELIVERED) en el rango seleccionado.
 *     tags: [Sales]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *         required: true
 *         description: Tipo de periodo
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           example: "2025-01-10"
 *         description: Fecha base (ISO). Si no se pasa, se usa la actual.
 *     responses:
 *       200:
 *         description: Resumen de ventas agregadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: "week"
 *                 start:
 *                   type: string
 *                   example: "2025-01-06T00:00:00.000Z"
 *                 end:
 *                   type: string
 *                   example: "2025-01-12T23:59:59.999Z"
 *                 totalSales:
 *                   type: number
 *                   example: 1234.56
 *                 totalOrders:
 *                   type: integer
 *                   example: 89
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.get("/sales/stats", apiKeyMiddleware, validate(salesQuerySchema), salesController.getAggregated);

/**
 * @swagger
 * /sales/manual:
 *   post:
 *     summary: Crear venta manual
 *     tags: [Sales]
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/sales/manual", apiKeyMiddleware, salesController.createManualSale);

/**
 * @swagger
 * /sales:
 *   get:
 *     summary: Listar ventas (histórico)
 *     tags: [Sales]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string }
 *       - in: query
 *         name: to
 *         schema: { type: string }
 *       - in: query
 *         name: source
 *         schema: { type: string, enum: [ORDER, MANUAL] }
 */
router.get("/sales", apiKeyMiddleware, salesController.getSales);

/**
 * @swagger
 * /sales/:id:
 *   get:
 *     summary: Detalle de venta
 *     tags: [Sales]
 */
router.get("/sales/:id", apiKeyMiddleware, salesController.getSaleById);

export default router;
