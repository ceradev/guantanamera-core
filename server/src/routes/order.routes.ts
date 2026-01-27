import { Router } from "express";
import * as orderController from "../controllers/order.controller.js";
import { apiKeyMiddleware } from "../middlewares/apiKey.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { orderRateLimit } from "../middlewares/order-rate-limit.middleware.js";
import { createOrderSchema } from "../validators/create-order.schema.js";
import { paginationSchema } from "../validators/pagination.schema.js";
import { orderIdSchema } from "../validators/order-id.schema.js";
import { z } from "zod";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItemInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Bocadillo de Jamón"
 *         quantity:
 *           type: integer
 *           example: 2
 *     CreateOrderInput:
 *       type: object
 *       required:
 *         - customerName
 *         - pickupTime
 *       properties:
 *         customerName:
 *           type: string
 *           example: "Juan Pérez"
 *         customerPhone:
 *           type: string
 *           description: "Opcional. Requerido si el total del pedido supera 30€"
 *           example: "+34600123456"
 *         pickupTime:
 *           type: string
 *           example: "20:30"
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItemInput'
 *     OrderResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 123
 *         status:
 *           type: string
 *           example: "RECEIVED"
 *         total:
 *           type: number
 *           example: 25.50
 *     PaginatedOrderResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderResponse'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             limit:
 *               type: integer
 *               example: 10
 *             total:
 *               type: integer
 *               example: 50
 *             totalPages:
 *               type: integer
 *               example: 5
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderInput'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderResponse'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post("/orders", orderRateLimit, validate(createOrderSchema), orderController.createOrder);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders with filtering and pagination
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [RECEIVED, PREPARING, READY, DELIVERED, CANCELLED]
 *         description: Filter orders by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of orders with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedOrderResponse'
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 *     security:
 *       - ApiKeyAuth: []
 */
router.get("/orders", apiKeyMiddleware, validate(paginationSchema), orderController.getOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The order ID
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderResponse'
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - ApiKeyAuth: []
 */
router.get("/orders/:id", apiKeyMiddleware, validate(orderIdSchema), orderController.getOrderById);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [RECEIVED, PREPARING, READY, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid status or transition
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - ApiKeyAuth: []
 */
const updateStatusSchema = z.object({
  params: orderIdSchema.shape.params,
  body: z.object({
    status: z.enum(["RECEIVED","PREPARING","READY","DELIVERED","CANCELLED"]),
  }),
});
router.patch("/orders/:id/status", apiKeyMiddleware, validate(updateStatusSchema), orderController.updateOrderStatus);

export default router;
