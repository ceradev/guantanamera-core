import { Response } from "express";
import { logger } from "../utils/logger.js";

class NotificationService {
  private clients: Map<Response, string[]> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) return;
    
    // Send a comment line every 30 seconds to keep connection alive
    this.heartbeatInterval = setInterval(() => {
      if (this.clients.size > 0) {
        this.clients.forEach((_, client) => {
          client.write(': heartbeat\n\n');
        });
      }
    }, 30000);
  }

  addClient(res: Response, interestedTypes?: string[]) {
    this.clients.set(res, interestedTypes || []);
    logger.info(`Client connected for notifications. Interested in: ${interestedTypes ? interestedTypes.join(', ') : 'ALL'}. Total clients: ${this.clients.size}`);
    
    // Send initial ping and retry interval (10 seconds)
    res.write(`retry: 10000\n`);
    res.write(`data: ${JSON.stringify({ type: "CONNECTED" })}\n\n`);

    res.on("close", () => {
      this.clients.delete(res);
      logger.info(`Client disconnected from notifications. Total clients: ${this.clients.size}`);
    });
  }

  notifyOrdersUpdated() {
    this.broadcast("ORDERS_UPDATED", { type: "ORDERS_UPDATED", timestamp: new Date().toISOString() });
    logger.info(`Notified clients of orders update`);
  }

  notifySettingsUpdated() {
    this.broadcast("SETTINGS_UPDATED", { type: "SETTINGS_UPDATED", timestamp: new Date().toISOString() });
    logger.info(`Notified clients of settings update`);
  }

  notifyProductsUpdated() {
    this.broadcast("PRODUCTS_UPDATED", { type: "PRODUCTS_UPDATED", timestamp: new Date().toISOString() });
    logger.info(`Notified clients of products update`);
  }

  private broadcast(type: string, data: object) {
    const payload = JSON.stringify(data);
    this.clients.forEach((interestedTypes, client) => {
      // If interestedTypes is empty, it means they want ALL events (backward compatibility for dashboard)
      // Otherwise, only send if the type is in their interest list
      if (interestedTypes.length === 0 || interestedTypes.includes(type)) {
        client.write(`data: ${payload}\n\n`);
      }
    });
  }
}

export const notificationService = new NotificationService();
