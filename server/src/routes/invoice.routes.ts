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
 * /invoices:
 *   post:
 *     summary: Crear una nueva factura
 *     tags: [Invoices]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - supplier
 *               - category
 *               - items
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-15"
 *               supplier:
 *                 type: string
 *                 example: "Proveedor ABC"
 *               reference:
 *                 type: string
 *                 example: "FAC-2025-001"
 *               category:
 *                 type: string
 *                 enum: [FOOD, DRINKS, SUPPLIES, RENT, UTILITIES, MAINTENANCE, OTHER]
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     unitPrice:
 *                       type: number
 *     responses:
 *       201:
 *         description: Factura creada
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
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
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicio del rango
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha fin del rango
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [FOOD, DRINKS, SUPPLIES, RENT, UTILITIES, MAINTENANCE, OTHER]
 *         description: Filtrar por categoría
 *     responses:
 *       200:
 *         description: Lista de facturas con total
 *       401:
 *         description: No autorizado
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalle de la factura
 *       404:
 *         description: Factura no encontrada
 *       401:
 *         description: No autorizado
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Factura eliminada
 *       404:
 *         description: Factura no encontrada
 *       401:
 *         description: No autorizado
 */
router.delete("/invoices/:id", apiKeyMiddleware, validate(invoiceIdSchema), invoiceController.deleteInvoice);

export default router;
