import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { apiKeyMiddleware } from "../middlewares/apiKey.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Real-time notifications system using SSE (Server-Sent Events)
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Subscribe to real-time notifications
 *     description: |
 *       Opens a Server-Sent Events (SSE) connection to receive real-time updates.
 *       The connection stays open and receives events when relevant data changes in the system.
 *       
23→ *       ### Events:
24→ *       - `CONNECTED`: Sent immediately after a successful connection.
25→ *       - `ORDERS_UPDATED`: Sent when a new order is created or an existing order is updated.
26→ *       - `SETTINGS_UPDATED`: Sent when system settings are updated.
27→ *       - `PRODUCTS_UPDATED`: Sent when products or categories are updated.
28→ *     tags: [Notifications]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: SSE connection established
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: "data: {\"type\": \"ORDERS_UPDATED\", \"timestamp\": \"2024-03-21T12:00:00Z\"}"
 *       401:
 *         description: Unauthorized
 * */
router.get("/notifications", apiKeyMiddleware, notificationController.subscribeToNotifications);

export default router;
