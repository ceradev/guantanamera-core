import { prisma } from "../prisma/client.js";
import { logger } from "../utils/logger.js";

export interface HealthStatus {
  status: "ok" | "degraded";
  uptime: number;
  database: "up" | "down";
  timestamp: string;
}

export const checkHealth = async (): Promise<HealthStatus> => {
  let dbStatus: "up" | "down" = "up";

  try {
    // Simple query to check database connectivity
    // Using $queryRaw is efficient for a lightweight check
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = "down";
    logger.warn("Healthcheck warning: Database is down or unreachable.", { error });
  }

  const status = dbStatus === "up" ? "ok" : "degraded";

  return {
    status,
    uptime: process.uptime(),
    database: dbStatus,
    timestamp: new Date().toISOString(),
  };
};
