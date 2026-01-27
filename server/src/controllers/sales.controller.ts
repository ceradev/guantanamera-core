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
    const { type, date } = (req as any).validated?.query ?? req.query;
    const baseDate = date ? new Date(date as string) : new Date();
    const period = (type as PeriodType) ?? "day";
    const stats = await getAggregatedSales(period, baseDate);
    res.json(stats);
  } catch (error: any) {
    logger.error(`Error fetching aggregated sales: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
