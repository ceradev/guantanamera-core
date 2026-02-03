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

/**
 * Scan invoice using OCR + AI
 */
export async function scanInvoice(file: File): Promise<import('@/types').InvoiceScanResult> {
  const formData = new FormData()
  formData.append('file', file)
  
  // Use fetchAPI but with FormData body (no JSON stringify)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'
  const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY || ''
  
  const response = await fetch(`${apiUrl}/invoices/scan`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
    },
    body: formData,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error al escanear' }))
    throw new Error(error.error || 'Error al escanear factura')
  }
  
  return response.json()
}

/**
 * Check scanner service status
 */
export async function checkScannerStatus(): Promise<{
  environment: string
  services: { ocr: boolean; llm: boolean }
}> {
  return fetchAPI('/invoices/scan/status', {}, true)
}

