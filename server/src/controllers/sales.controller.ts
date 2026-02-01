import { Request, Response } from "express";
import { getTodaySales, getAggregatedSales, type PeriodType } from "../services/sales.service.js";
import { logger } from "../utils/logger.js";

export const getToday = async (_req: Request, res: Response) => {
  try {
    const stats = await getTodaySales();
    res.json(stats);
  } catch (error: any) {
    logger.error(`Error fetching today's sales: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAggregated = async (req: Request, res: Response) => {
  try {
    const { type, date, source, from, to } = (req as any).validated?.query ?? req.query;
    const baseDate = date ? new Date(date as string) : new Date();
    const period = (type as PeriodType) ?? "day";
    
    // Parse custom date range
    const fromDate = from ? new Date(from as string) : undefined;
    const toDate = to ? new Date(to as string) : undefined;
    
    const stats = await getAggregatedSales(period, baseDate, source as SaleSource, fromDate, toDate);
    res.json(stats);
  } catch (error: any) {
    logger.error(`Error fetching aggregated sales: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// --- New Sales Controller Methods ---

import * as salesService from "../services/sales.service.js";
import { SaleSource } from "@prisma/client";

export const createManualSale = async (req: Request, res: Response) => {
  try {
    const sale = await salesService.createManualSale(req.body);
    res.status(201).json(sale);
  } catch (error: any) {
    logger.error(`Error creating manual sale: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

export const getSales = async (req: Request, res: Response) => {
  try {
    const { from, to, source, page, limit } = req.query;
    
    // If 'type' is present, it's likely the old aggregation request (legacy support or stats)
    // We can handle it here or let the route separation handle it.
    // For now, we assume this method handles the LIST of sales.
    
    const filters = {
      from: from as string,
      to: to as string,
      source: source as SaleSource,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    };

    const result = await salesService.getSales(filters);
    res.json(result);
  } catch (error: any) {
    logger.error(`Error fetching sales list: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getSaleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sale = await salesService.getSaleById(id);
    
    if (!sale) {
      return res.status(404).json({ error: "Sale not found" });
    }

    res.json(sale);
  } catch (error: any) {
    logger.error(`Error fetching sale by id: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
