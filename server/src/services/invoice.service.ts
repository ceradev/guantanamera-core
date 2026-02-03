import { prisma } from "../prisma/client.js";
import { ExpenseCategory } from "@prisma/client";

export { ExpenseCategory };

export interface CreateInvoiceInput {
  date: Date;
  supplier: string;
  reference?: string;
  category: ExpenseCategory;
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
  category?: ExpenseCategory;
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

  return prisma.invoice.create({
    data: {
      date: data.date,
      supplier: data.supplier,
      reference: data.reference,
      category: data.category,
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

  if (filters.category) {
    where.category = filters.category;
  }

  const invoices = await prisma.invoice.findMany({
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
 * Get invoice by ID
 */
export async function getInvoiceById(id: string) {
  return prisma.invoice.findUnique({
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
  return prisma.invoice.delete({
    where: { id },
  });
}
