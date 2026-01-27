import { Request, Response, NextFunction } from "express";

export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers["x-api-key"] || req.query.apiKey;
  const validApiKey = process.env.ADMIN_API_KEY;

  if (!validApiKey) {
    console.error("ADMIN_API_KEY is not defined in environment variables");
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }

  if (!apiKey || apiKey !== validApiKey) {
    console.warn(`Unauthorized access attempt to ${req.path} from ${req.ip}. 
      Query params: ${JSON.stringify(req.query)}
      Has x-api-key header: ${!!req.headers["x-api-key"]}`);
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
};
