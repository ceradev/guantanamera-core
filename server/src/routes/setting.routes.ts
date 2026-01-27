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
52→ *       200:
53→ *         description: Public store status (orders enabled, hours, info)
54→ *         content:
55→ *           application/json:
56→ *             schema:
57→ *               type: object
58→ *               properties:
59→ *                 orders_enabled:
60→ *                   type: boolean
61→ *                 weekly_schedule:
62→ *                   type: array
63→ *                   items:
64→ *                     type: object
65→ *                     properties:
66→ *                       day: { type: integer }
67→ *                       name: { type: string }
68→ *                       open: { type: string }
69→ *                       close: { type: string }
70→ *                       enabled: { type: boolean }
71→ *                 prep_time:
72→ *                   type: integer
73→ *                 store_name:
74→ *                   type: string
75→ *                 store_address:
76→ *                   type: string
77→ *                 store_phone:
78→ *                   type: string
79→ */
router.get("/settings/public/status", settingController.getPublicStatus);

export default router;
