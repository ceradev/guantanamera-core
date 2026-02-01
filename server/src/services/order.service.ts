import { prisma } from "../prisma/client.js";
import { OrderStatus, Prisma } from "@prisma/client";
import { logger } from "../utils/logger.js";
import { notificationService } from "./notification.service.js";
import * as settingService from "./setting.service.js";

interface CreateOrderInput {
  customerName: string;
  customerPhone?: string;
  pickupTime: string;
  items: { name: string; quantity: number }[];
}

const isStoreOpen = (settings: Record<string, any>, targetTimeStr?: string) => {
  if (settings.orders_enabled === false) return { open: false, reason: "Orders are currently disabled" };

  const prepTime = settings.prep_time || 15;

  // Get current time in Atlantic/Canary (Tenerife)
  const now = new Date();
  
  // Get components in the target timezone
  const getInTimezone = (date: Date, parts: Intl.DateTimeFormatOptions) => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Atlantic/Canary",
      ...parts
    });
    return formatter.format(date);
  };

  const currentTimeStr = getInTimezone(now, { hour: "2-digit", minute: "2-digit", hour12: false });
  const weekdayName = getInTimezone(now, { weekday: "long" });

  const dayMap: Record<string, number> = {
    "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6
  };
  const currentDay = dayMap[weekdayName];

  let openingTime = "";
  let closingTime = "";
  let isEnabled = false;

  if (settings.weekly_schedule) {
    try {
      const schedule = typeof settings.weekly_schedule === 'string' 
        ? JSON.parse(settings.weekly_schedule) 
        : settings.weekly_schedule;
      const todaySchedule = schedule.find((s: any) => s.day === currentDay);
      if (todaySchedule) {
        openingTime = todaySchedule.open;
        closingTime = todaySchedule.close;
        isEnabled = todaySchedule.enabled;
      }
    } catch (e) {
      console.error("Error parsing weekly schedule", e);
    }
  }

  if (!isEnabled) {
    return { open: false, reason: "Hoy el establecimiento permanece cerrado." };
  }

  if (!openingTime || !closingTime) {
    return { open: false, reason: "El horario para hoy no está configurado." };
  }

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const currentMinutes = timeToMinutes(currentTimeStr);
  const openingMinutes = timeToMinutes(openingTime);
  const closingMinutes = timeToMinutes(closingTime);

  // Handle midnight overlap (e.g., 09:00 to 01:00)
  const overlapsMidnight = closingMinutes < openingMinutes;
  
  const isWithinRange = (timeMinutes: number) => {
    if (overlapsMidnight) {
      return timeMinutes >= openingMinutes || timeMinutes <= closingMinutes;
    }
    return timeMinutes >= openingMinutes && timeMinutes <= closingMinutes;
  };

  // Check if current time is within window
  if (!isWithinRange(currentMinutes)) {
    return { open: false, reason: `El establecimiento está cerrado. Horario de hoy: ${openingTime} - ${closingTime}` };
  }

  // If targetTimeStr is provided (pickupTime), check if it's within window and in the future
  if (targetTimeStr) {
    const targetMinutes = timeToMinutes(targetTimeStr);
    if (!isWithinRange(targetMinutes)) {
      return { open: false, reason: `La hora de recogida debe estar entre ${openingTime} y ${closingTime}` };
    }
    
    let adjustedTarget = targetMinutes;
    if (overlapsMidnight && targetMinutes < openingMinutes && currentMinutes >= openingMinutes) {
        adjustedTarget += 1440;
    }

    if (adjustedTarget < currentMinutes + prepTime) {
      return { open: false, reason: `El tiempo mínimo de preparación es de ${prepTime} minutos` };
    }
  }

  return { open: true };
};

export const createOrder = async (data: CreateOrderInput) => {
  const { customerName, customerPhone, pickupTime, items } = data;

  // Check store status and hours
  const settings = await settingService.getSettings();
  
  const status = isStoreOpen(settings, pickupTime);
  if (!status.open) {
    throw new Error(status.reason);
  }

  if (items.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  // Fetch Products
  const productNames = items.map((i) => i.name);
  const products = await prisma.product.findMany({
    where: { name: { in: productNames }, active: true },
  });

  if (products.length !== productNames.length) {
    throw new Error("Some products are invalid or inactive");
  }

  // Calculate Total
  let total = 0;

  // Add items to total
  for (const item of items) {
    const product = products.find((p: { name: string; price: number }) => p.name === item.name);
    if (!product) throw new Error(`Product ${item.name} not found`);
    total += product.price * item.quantity;
  }

  // Add bag fee (0.10€)
  if (items.length > 0) {
    total = parseFloat((total + 0.10).toFixed(2));
  }

  if (total > 30 && !customerPhone) {
    throw new Error("Customer phone required for orders over 30€");
  }

  // Prepare OrderItems
  const orderItemsData: { productId: number; quantity: number; price: number }[] = [];

  // Add items
  for (const item of items) {
    const product = products.find((p: { name: string; id: number; price: number }) => p.name === item.name)!;
    orderItemsData.push({
      productId: product.id,
      quantity: item.quantity,
      price: product.price,
    });
  }

  // Create Order in Transaction
  const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    return tx.order.create({
      data: {
        customerName,
        customerPhone,
        pickupTime,
        status: "RECEIVED",
        total,
        items: {
          create: orderItemsData.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  });

  notificationService.notifyOrdersUpdated();

  return {
    id: order.id,
    status: order.status,
    total: order.total,
  };
};

export const getOrderById = async (id: number) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    status: order.status,
    customerName: order.customerName,
    customerPhone: order.customerPhone ?? undefined,
    pickupTime: order.pickupTime,
    total: order.total,
    items: order.items.map((item: typeof order.items[number]) => ({
      productId: item.productId,
      name: item.product.name,
      quantity: item.quantity,
      price: item.price,
    })),
    createdAt: order.createdAt,
  };
};

export const updateOrderStatus = async (id: number, status: OrderStatus) => {
  const order = await prisma.order.findUnique({ where: { id } });

  if (!order) {
    throw new Error("Order not found");
  }

  // State Transition Validation
  const currentStatus = order.status;

  if (currentStatus === OrderStatus.DELIVERED) {
    throw new Error("Cannot change status of a DELIVERED order");
  }

  if (currentStatus === OrderStatus.CANCELLED) {
    throw new Error("Cannot change status of a CANCELLED order");
  }

  let isValidTransition = false;

  switch (currentStatus) {
    case OrderStatus.RECEIVED:
      if (status === OrderStatus.PREPARING || status === OrderStatus.CANCELLED) {
        isValidTransition = true;
      }
      break;
    case OrderStatus.PREPARING:
      if (status === OrderStatus.READY || status === OrderStatus.CANCELLED) {
        isValidTransition = true;
      }
      break;
    case OrderStatus.READY:
      if (status === OrderStatus.DELIVERED) {
        isValidTransition = true;
      }
      break;
    default:
      isValidTransition = false;
  }

  if (!isValidTransition) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { 
      status,
    },
    select: {
      id: true,
      status: true,
    }
  });

  logger.info(`Order status updated: ${id} - ${currentStatus} -> ${status}`);
  
  // Create Sale if order is DELIVERED
  if (status === OrderStatus.DELIVERED) {
    try {
      await import("./sales.service.js").then(s => s.createSaleFromOrder(id));
    } catch (error) {
      logger.error(`Failed to create sale from order ${id}`, error);
    }
  }

  notificationService.notifyOrdersUpdated();

  return updatedOrder;
};

export const getOrders = async (
  status?: OrderStatus,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  const where = status ? { status } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: orders.map((order: typeof orders[number]) => ({
      id: order.id,
      status: order.status,
      customerName: order.customerName,
      customerPhone: order.customerPhone ?? undefined,
      pickupTime: order.pickupTime,
      total: order.total,
      createdAt: order.createdAt,
      items: order.items.map((item: typeof order.items[number]) => ({
        productId: item.productId,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
      })),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

