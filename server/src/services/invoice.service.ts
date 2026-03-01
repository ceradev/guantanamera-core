import { prisma } from "../prisma/client.js";

export interface CreateInvoiceInput {
  date: Date;
  supplier: string;
  reference?: string;
  notes?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface InvoiceFilters {
  from?: string;
  to?: string;
  supplier?: string;
}

/**
 * Create a new invoice with items
 */
export async function createInvoice(data: CreateInvoiceInput) {
  // Calculate total for each item and overall total
  const itemsWithTotal = data.items.map((item) => ({
    ...item,
    totalPrice: item.quantity * item.unitPrice,
  }));

  const totalAmount = itemsWithTotal.reduce((sum, item) => sum + item.totalPrice, 0);

  return (prisma.invoice as any).create({
    data: {
      date: data.date,
      supplier: data.supplier,
      reference: data.reference,
      notes: data.notes,
      totalAmount,
      items: {
        create: itemsWithTotal,
      },
    },
    include: {
      items: true,
    },
  });
}

/**
 * Get invoices with optional filters
 */
export async function getInvoices(filters: InvoiceFilters) {
  const where: any = {};

  if (filters.from || filters.to) {
    where.date = {};
    if (filters.from) {
      where.date.gte = new Date(filters.from);
    }
    if (filters.to) {
      // Set to end of day
      const toDate = new Date(filters.to);
      toDate.setHours(23, 59, 59, 999);
      where.date.lte = toDate;
    }
  }

  if (filters.supplier) {
    where.supplier = {
      contains: filters.supplier,
      mode: "insensitive",
    };
  }

  const invoices = await (prisma.invoice as any).findMany({
    where,
    include: {
      items: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  // Calculate total for the period
  const totalExpenses = invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);

  return {
    invoices,
    totalExpenses,
    count: invoices.length,
  };
}

/**
 * Get all unique suppliers
 */
export async function getSuppliers() {
  const result = await (prisma.invoice as any).findMany({
    distinct: ["supplier"],
    select: {
      supplier: true,
    },
    orderBy: {
      supplier: "asc",
    },
  });

  return result.map((r: any) => r.supplier);
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(id: string) {
  return (prisma.invoice as any).findUnique({
    where: { id },
    include: {
      items: true,
    },
  });
}

/**
 * Delete invoice by ID
 */
export async function deleteInvoice(id: string) {
  return (prisma.invoice as any).delete({
    where: { id },
  });
}
