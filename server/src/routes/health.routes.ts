import { Router } from "express";
import * as healthController from "../controllers/health.controller.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     HealthStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [ok, degraded]
 *           description: Global system status
 *           example: "ok"
 *         uptime:
 *           type: number
 *           description: Server uptime in seconds
 *           example: 123.45
 *         database:
 *           type: string
 *           enum: [up, down]
 *           description: Database connection status
 *           example: "up"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Current server time
 *           example: "2025-01-01T12:00:00Z"
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check server health
 *     description: Returns the status of the server and database connection. Useful for load balancers and monitoring systems.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server status information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 */
router.get("/health", healthController.getHealth);

export default router;
