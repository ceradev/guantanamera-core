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
  notes?: string
  createdAt: string
  items: InvoiceItem[]
}

export interface CreateInvoiceInput {
  date: string
  supplier: string
  reference?: string
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
