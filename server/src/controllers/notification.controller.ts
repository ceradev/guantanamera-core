import { Request, Response } from "express";
import { notificationService } from "../services/notification.service.js";

export const subscribeToNotifications = (req: Request, res: Response) => {
  const typesParam = req.query.types as string;
  const interestedTypes = typesParam ? typesParam.split(',') : undefined;

  console.log('New SSE subscription request', interestedTypes ? `for types: ${interestedTypes}` : 'for all types');
  
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Important for Nginx/Proxies

  notificationService.addClient(res, interestedTypes);
};
