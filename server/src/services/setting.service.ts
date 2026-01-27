import { prisma } from "../prisma/client.js";
import { notificationService } from "./notification.service.js";

export const getSettings = async () => {
  const settings = await prisma.setting.findMany();
  // Return as a key-value object for easier consumption in the frontend
  return settings.reduce((acc: Record<string, any>, curr: any) => {
    let value: any = curr.value;
    if (curr.type === "number") value = Number(curr.value);
    if (curr.type === "boolean") value = curr.value === "true";
    if (curr.type === "json") {
      try {
        value = JSON.parse(curr.value);
      } catch (e) {
        value = curr.value;
      }
    }
    acc[curr.key] = value;
    return acc;
  }, {} as Record<string, any>);
};

export const updateSettings = async (settings: Record<string, any>) => {
  const updates = Object.entries(settings).map(([key, value]) => {
    let stringValue = String(value);
    let type = "string";

    if (typeof value === "number") type = "number";
    else if (typeof value === "boolean") {
      type = "boolean";
      stringValue = value ? "true" : "false";
    } else if (typeof value === "object") {
      type = "json";
      stringValue = JSON.stringify(value);
    }

    return prisma.setting.upsert({
      where: { key },
      update: { value: stringValue, type },
      create: { key, value: stringValue, type },
    });
  });

  await Promise.all(updates);
  notificationService.notifySettingsUpdated();
  return getSettings();
};
