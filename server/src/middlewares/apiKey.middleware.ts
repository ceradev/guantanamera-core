import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers["x-api-key"] || req.query.apiKey;
  const validApiKey = env.ADMIN_API_KEY;

  if (!validApiKey) {
    logger.error("ADMIN_API_KEY no está definida en las variables de entorno");
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }

  if (!apiKey || apiKey !== validApiKey) {
    logger.warn(`Intento de acceso no autorizado a ${req.path} desde ${req.ip}. 
      Query params: ${JSON.stringify(req.query)}
      Tiene cabecera x-api-key: ${!!req.headers["x-api-key"]}`);
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
};
