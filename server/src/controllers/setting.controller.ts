import { Request, Response } from "express";
import * as settingService from "../services/setting.service.js";

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await settingService.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: (error as Error).message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const settings = await settingService.updateSettings(req.body);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: (error as Error).message });
  }
};

export const getPublicStatus = async (req: Request, res: Response) => {
  try {
    const settings = await settingService.getSettings();
    res.json({
      orders_enabled: settings.orders_enabled ?? true,
      weekly_schedule: settings.weekly_schedule || null,
      prep_time: settings.prep_time || 15,
      store_name: settings.store_name || "Guantanamera",
      store_address: settings.store_address || "",
      store_phone: settings.store_phone || "",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: (error as Error).message });
  }
};
