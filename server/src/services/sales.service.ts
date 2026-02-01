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
  products?: { productId: number; name: string; quantity: number; revenue: number }[];
  conversionRate?: number;
  purchaseFrequencyPerDay?: number;
  topCustomers?: { customerName: string; orders: number; revenue: number }[];
  previous?: { totalSales: number; totalOrders: number; averageOrderValue: number };
}

export const getAggregatedSales = async (type: PeriodType, baseDate?: Date, source?: SaleSource): Promise<SalesAggregate> => {
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

  const where: any = {
    date: {
      gte: start,
      lte: end,
    },
  };
  
  if (source) {
    where.source = source;
  }

  const result = await prisma.sale.aggregate({
    where,
    _sum: { totalAmount: true },
    _count: true,
  });

  const totalSales = parseFloat((result._sum.totalAmount ?? 0).toFixed(2));
  const totalOrders = typeof result._count === "number" ? result._count : 0;
  const averageOrderValue = totalOrders > 0 ? parseFloat((totalSales / totalOrders).toFixed(2)) : 0;

  const sales = await prisma.sale.findMany({
    where,
    include: {
      items: {
        include: {
          product: { select: { name: true, categoryId: true, category: { select: { name: true } } } },
        },
      },
      order: { select: { customerName: true } }
    },
  });

  const productUnits = new Map<number, { name: string; quantity: number }>();
  const productRevenue = new Map<number, { name: string; revenue: number }>();
  const categoryMap = new Map<number, { name: string; units: number; revenue: number }>();
  // Customer map only relevant for Order source, but we can track relatedOrderId
  
  for (const sale of sales) {
    for (const item of sale.items) {
      const unitsEntry = productUnits.get(item.productId);
      productUnits.set(item.productId, {
        name: item.product.name,
        quantity: (unitsEntry?.quantity ?? 0) + item.quantity,
      });
      const revEntry = productRevenue.get(item.productId);
      const itemRevenue = item.unitPrice * item.quantity; // Use stored unitPrice
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

  // Full products list for table
  const products = Array.from(productUnits.entries()).map(([productId, info]) => {
    const rev = productRevenue.get(productId)?.revenue ?? 0;
    return {
      productId,
      name: info.name,
      quantity: info.quantity,
      revenue: rev,
    };
  }).sort((a,b) => b.revenue - a.revenue);

  // Conversion rate logic relies on Orders logic (delivered vs cancelled). 
  // For Sales model, we only store completed sales. So conversion rate might be NA or we check Orders separately.
  // We'll skip complex conversion rate for now or keep it 0 unless we fetch Orders specifically.
  const conversionRate = 0; 
  const daysInRange = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 0);
  const purchaseFrequencyPerDay = parseFloat((totalOrders / daysInRange).toFixed(2));
  
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

  const prevWhere: any = {
    date: {
      gte: prevStart,
      lte: prevEnd,
    },
  };
  if (source) prevWhere.source = source;

  const prevAgg = await prisma.sale.aggregate({
    where: prevWhere,
    _sum: { totalAmount: true },
    _count: true,
  });
  const prevTotalSales = parseFloat((prevAgg._sum.totalAmount ?? 0).toFixed(2));
  const prevTotalOrders = typeof prevAgg._count === "number" ? prevAgg._count : 0;
  const prevAOV = prevTotalOrders > 0 ? parseFloat((prevTotalSales / prevTotalOrders).toFixed(2)) : 0;

  logger.info(`Sales Aggregate (New): type=${type} range=[${start.toISOString()} - ${end.toISOString()}] total=${totalSales}`);

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
    products,
    conversionRate,
    purchaseFrequencyPerDay,
    previous: {
      totalSales: prevTotalSales,
      totalOrders: prevTotalOrders,
      averageOrderValue: prevAOV,
    }
  };
}

// --- New Sales Logic ---

import { SaleSource, Sale } from "@prisma/client";

export interface CreateManualSaleInput {
  date: string; // ISO Date Time string
  items: { productId: number; quantity: number }[];
  notes?: string;
}

export const createSaleFromOrder = async (orderId: number) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });

  if (!order) throw new Error(`Order ${orderId} not found`);

  // Check if sale already exists for this order to avoid duplicates
  const existingSale = await prisma.sale.findFirst({
    where: { relatedOrderId: orderId },
  });

  if (existingSale) {
    logger.warn(`Sale already exists for order ${orderId}`);
    return existingSale;
  }

  const sale = await prisma.$transaction(async (tx) => {
    return tx.sale.create({
      data: {
        date: order.createdAt,
        source: SaleSource.ORDER,
        relatedOrderId: order.id,
        totalAmount: order.total,
        notes: `Auto-generated from Order #${order.id}`,
        items: {
          create: order.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
          })),
        },
      },
    });
  });

  logger.info(`Sale created from Order #${orderId}: SaleID=${sale.id}`);
  return sale;
};

export const createManualSale = async (data: CreateManualSaleInput) => {
  const { date, items, notes } = data;

  if (!items || items.length === 0) {
    throw new Error("At least one item is required");
  }

  // Fetch product prices
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  let totalAmount = 0;
  const saleItemsData = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);
    
    const totalPrice = product.price * item.quantity;
    totalAmount += totalPrice;

    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.price,
      totalPrice,
    };
  });

  const sale = await prisma.sale.create({
    data: {
      date: new Date(date),
      source: SaleSource.MANUAL,
      totalAmount,
      notes,
      items: {
        create: saleItemsData,
      },
    },
    include: {
      items: true,
    }
  });

  logger.info(`Manual Sale created: SaleID=${sale.id}`);
  return sale;
};

export const getSales = async (filters: {
  from?: string;
  to?: string;
  source?: SaleSource;
  page?: number;
  limit?: number;
}) => {
  const { from, to, source, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (from && to) {
    where.date = {
      gte: new Date(from),
      lte: new Date(to),
    };
  }
  if (source) {
    where.source = source;
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: "desc" },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
        order: {
          select: { id: true, customerName: true },
        },
      },
    }),
    prisma.sale.count({ where }),
  ]);

  return {
    data: sales,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getSaleById = async (id: string) => {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      order: true,
    },
  });
  return sale;
};
