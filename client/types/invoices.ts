export type ExpenseCategory = 
  | "FOOD" 
  | "DRINKS" 
  | "SUPPLIES" 
  | "RENT" 
  | "UTILITIES" 
  | "MAINTENANCE" 
  | "OTHER"

export interface InvoiceItem {
  id: string
  invoiceId: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Invoice {
  id: string
  date: string
  supplier: string
  reference?: string
  totalAmount: number
  category: ExpenseCategory
  notes?: string
  createdAt: string
  items: InvoiceItem[]
}

export interface CreateInvoiceInput {
  date: string
  supplier: string
  reference?: string
  category: ExpenseCategory
  notes?: string
  items: {
    description: string
    quantity: number
    unitPrice: number
  }[]
}

export interface InvoicesResponse {
  invoices: Invoice[]
  totalExpenses: number
  count: number
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  FOOD: "Comida",
  DRINKS: "Bebidas",
  SUPPLIES: "Suministros",
  RENT: "Alquiler",
  UTILITIES: "Servicios",
  MAINTENANCE: "Mantenimiento",
  OTHER: "Otros",
}
