import { Router } from "express";
import * as invoiceController from "../controllers/invoice.controller.js";
import { apiKeyMiddleware } from "../middlewares/apiKey.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createInvoiceSchema, invoiceQuerySchema, invoiceIdSchema } from "../validators/invoice.schema.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Endpoints de gastos/facturas (solo dashboard)
 */

/**
 * @swagger
 * /invoices/report:
 *   get:
 *     summary: Obtener reporte detallado de facturas y tendencias
 *     tags: [Invoices]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: supplierIds
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *     responses:
 *       200:
 *         description: Reporte de facturas
 */
router.get("/invoices/report", apiKeyMiddleware, validate(invoiceQuerySchema), invoiceController.getInvoiceReport);

/**
 * @swagger
 * /invoices:
 *   post:
 *     summary: Crear una nueva factura
 *     tags: [Invoices]
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/invoices", apiKeyMiddleware, validate(createInvoiceSchema), invoiceController.createInvoice);

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: Listar facturas con filtros opcionales
 *     tags: [Invoices]
 *     security:
 *       - ApiKeyAuth: []
 */
router.get("/invoices", apiKeyMiddleware, validate(invoiceQuerySchema), invoiceController.getInvoices);

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Obtener detalle de una factura
 *     tags: [Invoices]
 *     security:
 *       - ApiKeyAuth: []
 */
router.get("/invoices/:id", apiKeyMiddleware, validate(invoiceIdSchema), invoiceController.getInvoiceById);

/**
 * @swagger
 * /invoices/{id}:
 *   delete:
 *     summary: Eliminar una factura
 *     tags: [Invoices]
 *     security:
 *       - ApiKeyAuth: []
 */
router.delete("/invoices/:id", apiKeyMiddleware, validate(invoiceIdSchema), invoiceController.deleteInvoice);

export default router;
