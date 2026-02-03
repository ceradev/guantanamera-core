import { Router, Request, Response } from "express";
import multer from "multer";
import { salesAiService } from "../ai/sales/sales-ai.service.js";
import { apiKeyMiddleware } from "../middlewares/apiKey.middleware.js";
import { logger } from "../utils/logger.js";

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WebP and PDF files are allowed"));
    }
  },
});

/**
 * @swagger
 * tags:
 *   name: Sales AI
 *   description: AI-powered sales ticket scanning
 */

/**
 * @swagger
 * /sales/scan:
 *   post:
 *     summary: Scan a sales ticket and get product suggestions
 *     tags: [Sales AI]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image or PDF of the sales ticket
 *               language:
 *                 type: string
 *                 default: spa
 *                 description: OCR language (spa, eng)
 *     responses:
 *       200:
 *         description: Suggested products based on ticket analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 totalDetected:
 *                   type: number
 *                   nullable: true
 *                 dateDetected:
 *                   type: string
 *                   nullable: true
 *                 suggestedItems:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productId:
 *                         type: number
 *                       name:
 *                         type: string
 *                       quantity:
 *                         type: number
 *                       unitPrice:
 *                         type: number
 *                 approximateTotal:
 *                   type: number
 *                 confidence:
 *                   type: number
 *                 notes:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: No file provided or processing error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/sales/scan",
  apiKeyMiddleware,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const language = (req.body.language as string) || "spa";
      
      logger.info(`[SalesAI Route] Processing file: ${req.file.originalname}, size: ${req.file.size} bytes`);

      const result = await salesAiService.processSalesTicket(
        req.file.buffer,
        language
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      logger.error(`[SalesAI Route] Error: ${error.message}`);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /sales/scan/status:
 *   get:
 *     summary: Check if sales AI services are available
 *     tags: [Sales AI]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: AI services status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                 ocr:
 *                   type: boolean
 *                 llm:
 *                   type: boolean
 *                 products:
 *                   type: number
 *                   description: Number of active products
 */
router.get(
  "/sales/scan/status",
  apiKeyMiddleware,
  async (_req: Request, res: Response) => {
    try {
      const status = await salesAiService.checkStatus();
      res.json(status);
    } catch (error: any) {
      logger.error(`[SalesAI Route] Status check error: ${error.message}`);
      res.status(500).json({
        available: false,
        ocr: false,
        llm: false,
        products: 0,
        error: error.message,
      });
    }
  }
);

export default router;
