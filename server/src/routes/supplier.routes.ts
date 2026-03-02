import { Router } from "express";
import * as supplierController from "../controllers/supplier.controller.js";
import { apiKeyMiddleware } from "../middlewares/apiKey.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Endpoints para gestión de proveedores
 */

router.post("/suppliers", apiKeyMiddleware, supplierController.createSupplier);
router.get("/suppliers", apiKeyMiddleware, supplierController.getSuppliers);
router.get("/suppliers/:id", apiKeyMiddleware, supplierController.getSupplierById);
router.put("/suppliers/:id", apiKeyMiddleware, supplierController.updateSupplier);
router.delete("/suppliers/:id", apiKeyMiddleware, supplierController.deleteSupplier);

export default router;
