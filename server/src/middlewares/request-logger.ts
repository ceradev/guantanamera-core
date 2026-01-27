import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const { method, url } = req;
  
  // Intercept the response to log status code after it finishes
  res.on("finish", () => {
    const { statusCode } = res;
    logger.info(`${method} ${url} ${statusCode}`);
  });

  next();
};
