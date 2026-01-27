import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";
import { Prisma } from "@prisma/client";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { method, url } = req;
  
  logger.error(`${method} ${url} - ${err.message}`);

  // Handle Prisma Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        error: "Conflict",
        message: "Unique constraint failed"
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({
        error: "Not Found",
        message: "Record not found"
      });
      return;
    }
  }

  const status = (err as any).status || (err as any).statusCode || 500;

  res.status(status).json({
    error: status === 500 ? "Internal Server Error" : "Error",
    message: process.env.NODE_ENV === "development" || status < 500 ? err.message : undefined,
  });
};
