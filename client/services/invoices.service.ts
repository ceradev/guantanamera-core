import { fetchAPI } from '@/lib/api'
import type { 
  Invoice, 
  InvoicesResponse, 
  CreateInvoiceInput,
  Supplier,
  InvoiceReport
} from '@/types'

export interface InvoiceFilters {
  from?: string
  to?: string
  supplierIds?: string[]
}

/**
 * Get invoices with optional filters
 */
export async function getInvoices(filters: InvoiceFilters = {}): Promise<InvoicesResponse> {
  const params = new URLSearchParams()
  if (filters.from) params.append('from', filters.from)
  if (filters.to) params.append('to', filters.to)
  
  if (filters.supplierIds) {
    filters.supplierIds.forEach(id => params.append('supplierIds', id))
  }
  
  const queryString = params.toString()
  const endpoint = queryString ? `/invoices?${queryString}` : '/invoices'
  
  return fetchAPI<InvoicesResponse>(endpoint, {}, true)
}

/**
 * Create a new supplier
 */
export async function createSupplier(data: Partial<Supplier>): Promise<Supplier> {
  return fetchAPI<Supplier>('/suppliers', {
    method: 'POST',
    body: JSON.stringify(data),
  }, true)
}

/**
 * Update a supplier
 */
export async function updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {
  return fetchAPI<Supplier>(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, true)
}

/**
 * Delete a supplier
 */
export async function deleteSupplier(id: string): Promise<void> {
  await fetchAPI<void>(`/suppliers/${id}`, {
    method: 'DELETE',
  }, true)
}

/**
 * Get invoice reporting summary and trends
 */
export async function getInvoiceReport(filters: InvoiceFilters = {}): Promise<InvoiceReport> {
  const params = new URLSearchParams()
  if (filters.from) params.append('from', filters.from)
  if (filters.to) params.append('to', filters.to)
  
  if (filters.supplierIds) {
    filters.supplierIds.forEach(id => params.append('supplierIds', id))
  }
  
  const queryString = params.toString()
  const endpoint = queryString ? `/invoices/report?${queryString}` : '/invoices/report'
  
  return fetchAPI<InvoiceReport>(endpoint, {}, true)
}

/**
 * Get all suppliers
 */
export async function getSuppliers(): Promise<Supplier[]> {
  return fetchAPI<Supplier[]>('/suppliers', {}, true)
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
