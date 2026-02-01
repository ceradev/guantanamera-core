import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { apiKeyMiddleware } from "../middlewares/apiKey.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Real-time notifications system using Server-Sent Events (SSE)
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Subscribe to real-time notifications
 *     description: |
 *       Opens a Server-Sent Events (SSE) connection to receive real-time updates.
 *       The connection stays open and receives events when relevant data changes.
 *
 *       Events sent through this stream:
 *       - CONNECTED: Sent immediately after a successful connection
 *       - ORDERS_UPDATED: Sent when an order is created or updated
 *       - SETTINGS_UPDATED: Sent when system settings are updated
 *       - PRODUCTS_UPDATED: Sent when products or categories are updated
 *     tags:
 *       - Notifications
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: SSE connection established
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: "data: {\"type\":\"ORDERS_UPDATED\",\"timestamp\":\"2024-03-21T12:00:00Z\"}"
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/notifications",
  apiKeyMiddleware,
  notificationController.subscribeToNotifications
);

export default router;
