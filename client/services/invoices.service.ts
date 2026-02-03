import { fetchAPI } from '@/lib/api'
import type { 
  Invoice, 
  InvoicesResponse, 
  CreateInvoiceInput, 
  ExpenseCategory 
} from '@/types'

export interface InvoiceFilters {
  from?: string
  to?: string
  category?: ExpenseCategory
}

/**
 * Get invoices with optional filters
 */
export async function getInvoices(filters: InvoiceFilters = {}): Promise<InvoicesResponse> {
  const params = new URLSearchParams()
  if (filters.from) params.append('from', filters.from)
  if (filters.to) params.append('to', filters.to)
  if (filters.category) params.append('category', filters.category)
  
  const queryString = params.toString()
  const endpoint = queryString ? `/invoices?${queryString}` : '/invoices'
  
  return fetchAPI<InvoicesResponse>(endpoint, {}, true)
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(id: string): Promise<Invoice> {
  return fetchAPI<Invoice>(`/invoices/${id}`, {}, true)
}

/**
 * Create a new invoice
 */
export async function createInvoice(data: CreateInvoiceInput): Promise<Invoice> {
  return fetchAPI<Invoice>('/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  }, true)
}

/**
 * Delete invoice by ID
 */
export async function deleteInvoice(id: string): Promise<void> {
  await fetchAPI<void>(`/invoices/${id}`, {
    method: 'DELETE',
  }, true)
}
