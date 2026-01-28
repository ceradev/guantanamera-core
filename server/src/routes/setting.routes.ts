import { Router } from "express";
import * as settingController from "../controllers/setting.controller.js";
import { apiKeyMiddleware } from "../middlewares/apiKey.middleware.js";

const router = Router();

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get all system settings
 *     tags: [Settings]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: All settings as a key-value object
 *       401:
 *         description: Unauthorized
 */
router.get("/settings", apiKeyMiddleware, settingController.getSettings);

/**
 * @swagger
 * /settings:
 *   patch:
 *     summary: Update system settings
 *     tags: [Settings]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated settings
 *       401:
 *         description: Unauthorized
 */
router.patch("/settings", apiKeyMiddleware, settingController.updateSettings);

/**
 * @swagger
 * /settings/public/status:
 *   get:
 *     summary: Get public store status
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Public store status (orders enabled, hours, info)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders_enabled:
 *                   type: boolean
 *                 weekly_schedule:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       day: { type: integer }
 *                       name: { type: string }
 *                       open: { type: string }
 *                       close: { type: string }
 *                       enabled: { type: boolean }
 *                 prep_time:
 *                   type: integer
 *                 store_name:
 *                   type: string
 *                 store_address:
 *                   type: string
 *                 store_phone:
 *                   type: string
 */
router.get("/settings/public/status", settingController.getPublicStatus);

export default router;
