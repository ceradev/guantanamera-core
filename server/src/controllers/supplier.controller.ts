import { Request, Response } from "express";
import * as supplierService from "../services/supplier.service.js";
import { logger } from "../utils/logger.js";

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const supplier = await supplierService.createSupplier(data);
    res.status(201).json(supplier);
  } catch (error: any) {
    logger.error(`Error creating supplier: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

export const getSuppliers = async (_req: Request, res: Response) => {
  try {
    const suppliers = await supplierService.getSuppliers();
    res.json(suppliers);
  } catch (error: any) {
    logger.error(`Error fetching suppliers: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getSupplierById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await supplierService.getSupplierById(id);

    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    res.json(supplier);
  } catch (error: any) {
    logger.error(`Error fetching supplier by id: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const supplier = await supplierService.updateSupplier(id, data);
    res.json(supplier);
  } catch (error: any) {
    logger.error(`Error updating supplier: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await supplierService.deleteSupplier(id);
    res.status(204).send();
  } catch (error: any) {
    logger.error(`Error deleting supplier: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
