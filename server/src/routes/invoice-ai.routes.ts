import { Router, Request, Response } from "express";
import multer, { FileFilterCallback } from "multer";
import { invoiceAiService } from "../ai/index.js";
import { apiKeyMiddleware } from "../middlewares/apiKey.middleware.js";
import { logger } from "../utils/logger.js";

const router = Router();

// Configure multer for file uploads (memory storage for buffers)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/tiff", "application/pdf"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, WebP, TIFF and PDF are allowed."));
    }
  },
});

/**
 * @swagger
 * tags:
 *   name: Invoice AI
 *   description: AI-powered invoice scanning
 */

/**
 * @swagger
 * /invoices/scan:
 *   post:
 *     summary: Scan an invoice image using OCR + AI
 *     tags: [Invoice AI]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Invoice image (JPEG, PNG, WebP, TIFF, PDF)
 *               language:
 *                 type: string
 *                 default: spa
 *                 description: OCR language code
 *     responses:
 *       200:
 *         description: Successfully processed invoice
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 rawText:
 *                   type: string
 *                 ocrConfidence:
 *                   type: number
 *                 extractedData:
 *                   type: object
 *                   properties:
 *                     supplier:
 *                       type: string
 *                     date:
 *                       type: string
 *                     totalAmount:
 *                       type: number
 *                     reference:
 *                       type: string
 *                     items:
 *                       type: array
 *       400:
 *         description: No file provided or invalid file type
 *       401:
 *         description: Unauthorized
 *       503:
 *         description: AI services unavailable
 */
router.post(
  "/invoices/scan",
  apiKeyMiddleware,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      // Check file
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      logger.info(`Processing invoice scan: ${req.file.originalname} (${req.file.size} bytes)`);

      // Check services availability
      const services = await invoiceAiService.checkServices();
      if (!services.llm) {
        return res.status(503).json({
          error: "Ollama LLM service is not available. Make sure Ollama is running.",
          hint: "Start Ollama with: ollama serve",
        });
      }

      // Get language from request (default: Spanish)
      const language = (req.body?.language as string) || "spa";

      // Process invoice
      const result = await invoiceAiService.processInvoice(req.file.buffer, language);

      res.json(result);
    } catch (error: any) {
      logger.error(`Invoice scan error: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /invoices/scan/status:
 *   get:
 *     summary: Check AI services availability
 *     tags: [Invoice AI]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Services status
 */
router.get("/invoices/scan/status", apiKeyMiddleware, async (_req: Request, res: Response) => {
  try {
    const services = await invoiceAiService.checkServices();
    res.json({
      environment: process.env.NODE_ENV || "development",
      services,
      ollamaUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      ollamaModel: process.env.OLLAMA_MODEL || "mistral",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
