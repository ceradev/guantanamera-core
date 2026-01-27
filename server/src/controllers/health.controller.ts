import { Request, Response } from "express";
import * as healthService from "../services/health.service.js";

export const getHealth = async (_req: Request, res: Response) => {
  const healthStatus = await healthService.checkHealth();
  
  // Always return 200 OK for the endpoint itself, unless critical infrastructure failure
  // even if 'status' is 'degraded', the service is reachable.
  res.json(healthStatus);
};
