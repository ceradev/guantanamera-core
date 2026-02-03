import { Request, Response } from "express";
import * as invoiceService from "../services/invoice.service.js";
import { ExpenseCategory } from "../services/invoice.service.js";
import { logger } from "../utils/logger.js";

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const data = (req as any).validated?.body ?? req.body;
    const invoice = await invoiceService.createInvoice(data);
    res.status(201).json(invoice);
  } catch (error: any) {
    logger.error(`Error creating invoice: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const { from, to, category } = (req as any).validated?.query ?? req.query;
    
    const filters = {
      from: from as string,
      to: to as string,
      category: category as ExpenseCategory,
    };

    const result = await invoiceService.getInvoices(filters);
    res.json(result);
  } catch (error: any) {
    logger.error(`Error fetching invoices: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const { id } = (req as any).validated?.params ?? req.params;
    const invoice = await invoiceService.getInvoiceById(id);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(invoice);
  } catch (error: any) {
    logger.error(`Error fetching invoice by id: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = (req as any).validated?.params ?? req.params;
    
    // Check if invoice exists
    const existing = await invoiceService.getInvoiceById(id);
    if (!existing) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    await invoiceService.deleteInvoice(id);
    res.status(204).send();
  } catch (error: any) {
    logger.error(`Error deleting invoice: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
