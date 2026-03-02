import { prisma } from "../prisma/client.js";

export interface CreateInvoiceInput {
  date: Date;
  supplierId: string;
  reference?: string;
  notes?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }[];
}

export interface InvoiceFilters {
  from?: string;
  to?: string;
  supplierIds?: string[];
}

/**
 * Create a new invoice with items and tax calculations
 */
export async function createInvoice(data: CreateInvoiceInput) {
  // Calculate tax and totals for each item
  const itemsWithTaxes = data.items.map((item) => {
    const taxRate = item.taxRate || 0;
    const basePrice = item.quantity * item.unitPrice;
    const taxAmount = basePrice * (taxRate / 100);
    const totalPrice = basePrice + taxAmount;

    return {
      ...item,
      taxRate,
      taxAmount,
      totalPrice,
    };
  });

  const baseAmount = itemsWithTaxes.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = itemsWithTaxes.reduce((sum, item) => sum + item.taxAmount, 0);
  const totalAmount = baseAmount + taxAmount;

  return (prisma.invoice as any).create({
    data: {
      date: data.date,
      supplierId: data.supplierId,
      reference: data.reference,
      notes: data.notes,
      baseAmount,
      taxAmount,
      totalAmount,
      items: {
        create: itemsWithTaxes,
      },
    },
    include: {
      items: true,
      supplier: true,
    },
  });
}

/**
 * Get invoices with optional filters (supports multi-supplier)
 */
export async function getInvoices(filters: InvoiceFilters) {
  const where: any = {};

  if (filters.from || filters.to) {
    where.date = {};
    if (filters.from) {
      where.date.gte = new Date(filters.from);
    }
    if (filters.to) {
      const toDate = new Date(filters.to);
      toDate.setHours(23, 59, 59, 999);
      where.date.lte = toDate;
    }
  }

  if (filters.supplierIds && filters.supplierIds.length > 0) {
    where.supplierId = {
      in: filters.supplierIds,
    };
  }

  const invoices = await (prisma.invoice as any).findMany({
    where,
    include: {
      items: true,
      supplier: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  const totalAmount = invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
  const totalBase = invoices.reduce((sum: number, inv: any) => sum + inv.baseAmount, 0);
  const totalTax = invoices.reduce((sum: number, inv: any) => sum + inv.taxAmount, 0);

  return {
    invoices,
    totals: {
      totalAmount,
      totalBase,
      totalTax,
      count: invoices.length,
    },
  };
}

/**
 * Get reporting summaries and trends
 */
export async function getInvoiceReport(filters: InvoiceFilters) {
  const { invoices, totals } = await getInvoices(filters);

  // Group by supplier for subtotals
  const supplierSubtotals = invoices.reduce((acc: any, inv: any) => {
    const sId = inv.supplierId;
    if (!acc[sId]) {
      acc[sId] = {
        supplierName: inv.supplier.name,
        count: 0,
        totalBase: 0,
        totalTax: 0,
        totalAmount: 0,
      };
    }
    acc[sId].count += 1;
    acc[sId].totalBase += inv.baseAmount;
    acc[sId].totalTax += inv.taxAmount;
    acc[sId].totalAmount += inv.totalAmount;
    return acc;
  }, {});

  // Group by month for trends
  const monthlyTrends = invoices.reduce((acc: any, inv: any) => {
    const month = new Date(inv.date).toISOString().substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = {
        month,
        totalAmount: 0,
        count: 0,
      };
    }
    acc[month].totalAmount += inv.totalAmount;
    acc[month].count += 1;
    return acc;
  }, {});

  return {
    summary: totals,
    supplierSubtotals: Object.values(supplierSubtotals),
    trends: Object.values(monthlyTrends).sort((a: any, b: any) => a.month.localeCompare(b.month)),
    invoices, // Include the full list for detailed reporting
  };
}

export async function getInvoiceById(id: string) {
  return (prisma.invoice as any).findUnique({
    where: { id },
    include: {
      items: true,
      supplier: true,
    },
  });
}

export async function deleteInvoice(id: string) {
  return (prisma.invoice as any).delete({
    where: { id },
  });
}
