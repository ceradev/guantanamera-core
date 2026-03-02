export interface Supplier {
  id: string
  name: string
  fiscalId?: string
  address?: string
  email?: string
  phone?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface InvoiceItem {
  id: string
  invoiceId: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  taxAmount: number
  totalPrice: number
}

export interface Invoice {
  id: string
  date: string
  supplierId: string
  supplier: Supplier
  reference?: string
  baseAmount: number
  taxAmount: number
  totalAmount: number
  notes?: string
  createdAt: string
  items: InvoiceItem[]
}

export interface CreateInvoiceInput {
  date: string
  supplierId: string
  reference?: string
  notes?: string
  items: {
    description: string
    quantity: number
    unitPrice: number
    taxRate?: number
  }[]
}

export interface InvoicesResponse {
  invoices: Invoice[]
  totals: {
    totalAmount: number
    totalBase: number
    totalTax: number
    count: number
  }
}

export interface InvoiceReport {
  summary: {
    totalAmount: number
    totalBase: number
    totalTax: number
    count: number
  }
  supplierSubtotals: {
    supplierName: string
    count: number
    totalBase: number
    totalTax: number
    totalAmount: number
  }[]
  trends: {
    month: string
    totalAmount: number
    count: number
  }[]
  invoices: Invoice[]
}
