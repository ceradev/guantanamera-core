import { prisma } from "../prisma/client.js";
import { OrderStatus } from "@prisma/client";
import { logger } from "../utils/logger.js";

export interface TopProduct {
  productId: number;
  name: string;
  quantity: number;
}

export interface TodaySales {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: TopProduct[];
}

export const getTodaySales = async (): Promise<TodaySales> => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      status: OrderStatus.DELIVERED,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
    },
  });

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum: number, o: { total: number }) => sum + o.total, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const productMap = new Map<number, { name: string; quantity: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const current = productMap.get(item.productId);
      const nextQty = (current?.quantity ?? 0) + item.quantity;
      productMap.set(item.productId, {
        name: item.product.name,
        quantity: nextQty,
      });
    }
  }

  const topProducts = Array.from(productMap.entries())
    .map(([productId, { name, quantity }]) => ({ productId, name, quantity }))
    .sort((a, b) => b.quantity - a.quantity);

  const result: TodaySales = {
    date: now.toISOString().slice(0, 10),
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalOrders,
    averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
    topProducts,
  };

  logger.info(
    `Sales Today: date=${result.date} orders=${result.totalOrders} revenue=${result.totalRevenue}`
  );

  return result;
};

export type PeriodType = "day" | "week" | "month";

export interface SalesAggregate {
  type: PeriodType;
  start: string;
  end: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProductByUnits?: { productId: number; name: string; quantity: number };
  topProductByRevenue?: { productId: number; name: string; revenue: number };
  categories?: { categoryId: number; name: string; units: number; revenue: number }[];
  conversionRate?: number;
  purchaseFrequencyPerDay?: number;
  topCustomers?: { customerName: string; orders: number; revenue: number }[];
  previous?: { totalSales: number; totalOrders: number; averageOrderValue: number };
}

export const getAggregatedSales = async (type: PeriodType, baseDate?: Date): Promise<SalesAggregate> => {
  const date = baseDate ?? new Date();

  const start = new Date(date);
  const end = new Date(date);

  // Start/End of Day
  const setStartOfDay = (d: Date) => d.setHours(0, 0, 0, 0);
  const setEndOfDay = (d: Date) => d.setHours(23, 59, 59, 999);

  if (type === "day") {
    setStartOfDay(start);
    setEndOfDay(end);
  } else if (type === "week") {
    // Week starts on Monday
    // JS getDay(): 0=Sunday, 1=Monday,...6=Saturday
    const day = start.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diffToMonday);
    setStartOfDay(start);
    const diffToSunday = 6 - diffToMonday;
    end.setDate(end.getDate() + diffToSunday);
    setEndOfDay(end);
  } else {
    // month
    start.setDate(1);
    setStartOfDay(start);
    // move to last day of month
    end.setMonth(end.getMonth() + 1, 0);
    setEndOfDay(end);
  }

  const result = await prisma.order.aggregate({
    where: {
      status: OrderStatus.DELIVERED,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    _sum: { total: true },
    _count: true,
  });

  const totalSales = parseFloat((result._sum.total ?? 0).toFixed(2));
  const totalOrders = typeof result._count === "number" ? result._count : 0;
  const averageOrderValue = totalOrders > 0 ? parseFloat((totalSales / totalOrders).toFixed(2)) : 0;

  const orders = await prisma.order.findMany({
    where: {
      status: OrderStatus.DELIVERED,
      createdAt: { gte: start, lte: end },
    },
    include: {
      items: {
        include: {
          product: { select: { name: true, categoryId: true, category: { select: { name: true } } } },
        },
      },
    },
  });

  const productUnits = new Map<number, { name: string; quantity: number }>();
  const productRevenue = new Map<number, { name: string; revenue: number }>();
  const categoryMap = new Map<number, { name: string; units: number; revenue: number }>();
  const customerMap = new Map<string, { orders: number; revenue: number }>();

  for (const order of orders) {
    customerMap.set(order.customerName, {
      orders: (customerMap.get(order.customerName)?.orders ?? 0) + 1,
      revenue: parseFloat(((customerMap.get(order.customerName)?.revenue ?? 0) + order.total).toFixed(2)),
    });
    for (const item of order.items) {
      const unitsEntry = productUnits.get(item.productId);
      productUnits.set(item.productId, {
        name: item.product.name,
        quantity: (unitsEntry?.quantity ?? 0) + item.quantity,
      });
      const revEntry = productRevenue.get(item.productId);
      const itemRevenue = item.price * item.quantity;
      productRevenue.set(item.productId, {
        name: item.product.name,
        revenue: parseFloat(((revEntry?.revenue ?? 0) + itemRevenue).toFixed(2)),
      });
      const catId = item.product.categoryId;
      const catName = item.product.category?.name ?? "Sin categoría";
      const catEntry = categoryMap.get(catId);
      categoryMap.set(catId, {
        name: catName,
        units: (catEntry?.units ?? 0) + item.quantity,
        revenue: parseFloat(((catEntry?.revenue ?? 0) + itemRevenue).toFixed(2)),
      });
    }
  }

  let topByUnits: { productId: number; name: string; quantity: number } | undefined;
  for (const [productId, info] of productUnits.entries()) {
    if (!topByUnits || info.quantity > topByUnits.quantity) {
      topByUnits = { productId, name: info.name, quantity: info.quantity };
    }
  }
  let topByRevenue: { productId: number; name: string; revenue: number } | undefined;
  for (const [productId, info] of productRevenue.entries()) {
    if (!topByRevenue || info.revenue > topByRevenue.revenue) {
      topByRevenue = { productId, name: info.name, revenue: info.revenue };
    }
  }

  const categories = Array.from(categoryMap.entries()).map(([categoryId, v]) => ({
    categoryId,
    name: v.name,
    units: v.units,
    revenue: v.revenue,
  })).sort((a, b) => b.revenue - a.revenue);

  const cancelledCount = await prisma.order.count({
    where: {
      status: OrderStatus.CANCELLED,
      createdAt: { gte: start, lte: end },
    }
  });
  const conversionRate = (totalOrders + cancelledCount) > 0 ? parseFloat(((totalOrders / (totalOrders + cancelledCount)) * 100).toFixed(2)) : 0;
  const daysInRange = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 0);
  const purchaseFrequencyPerDay = parseFloat((totalOrders / daysInRange).toFixed(2));
  const topCustomers = Array.from(customerMap.entries()).map(([name, v]) => ({
    customerName: name,
    orders: v.orders,
    revenue: v.revenue,
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Previous period
  const prevStart = new Date(start);
  const prevEnd = new Date(end);
  if (type === "day") {
    prevStart.setDate(prevStart.getDate() - 1);
    prevEnd.setDate(prevEnd.getDate() - 1);
  } else if (type === "week") {
    prevStart.setDate(prevStart.getDate() - 7);
    prevEnd.setDate(prevEnd.getDate() - 7);
  } else {
    prevStart.setMonth(prevStart.getMonth() - 1);
    prevEnd.setMonth(prevEnd.getMonth() - 1);
  }
  const prevAgg = await prisma.order.aggregate({
    where: {
      status: OrderStatus.DELIVERED,
      createdAt: {
        gte: prevStart,
        lte: prevEnd,
      },
    },
    _sum: { total: true },
    _count: true,
  });
  const prevTotalSales = parseFloat((prevAgg._sum.total ?? 0).toFixed(2));
  const prevTotalOrders = typeof prevAgg._count === "number" ? prevAgg._count : 0;
  const prevAOV = prevTotalOrders > 0 ? parseFloat((prevTotalSales / prevTotalOrders).toFixed(2)) : 0;

  logger.info(`Sales Aggregate: type=${type} range=[${start.toISOString()} - ${end.toISOString()}] total=${totalSales} orders=${totalOrders}`);

  return {
    type,
    start: start.toISOString(),
    end: end.toISOString(),
    totalSales,
    totalOrders,
    averageOrderValue,
    topProductByUnits: topByUnits,
    topProductByRevenue: topByRevenue,
    categories,
    conversionRate,
    purchaseFrequencyPerDay,
    topCustomers,
    previous: {
      totalSales: prevTotalSales,
      totalOrders: prevTotalOrders,
      averageOrderValue: prevAOV,
    }
  };
}
