import { fetchAPI } from '@/lib/api'
import type { SalesAggregate, SalesPeriod, TodaySales, ScannedSaleData, SalesScannerStatus } from '@/types'

/**
 * Obtiene las ventas del día.
 * @returns Métricas de ventas del día.
 */
export async function getSalesToday(): Promise<TodaySales> {
  return fetchAPI<TodaySales>('/sales/today', {}, true)
}

/**
 * Obtiene agregados de ventas por periodo.
 * @param type Periodo de agregación.
 * @param date Fecha opcional de referencia.
 * @param source Fuente opcional (ORDER | MANUAL).
 * @param from Fecha inicio para rango personalizado.
 * @param to Fecha fin para rango personalizado.
 * @returns Agregado de ventas.
 */
export async function getSales(
  type: SalesPeriod,
  date?: string,
  source?: string,
  from?: string,
  to?: string
): Promise<SalesAggregate> {
  const params = new URLSearchParams({ type })
  if (date) params.append('date', date)
  if (source) params.append('source', source)
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  return fetchAPI<SalesAggregate>(`/sales/stats?${params.toString()}`, {}, true)
}

export interface CreateManualSaleInput {
  date: string;
  items: { productId: number; quantity: number }[];
  notes?: string;
}

export async function createManualSale(data: CreateManualSaleInput): Promise<any> {
  return fetchAPI('/sales/manual', {
    method: 'POST',
    body: JSON.stringify(data),
  }, true)
}

// AI Scanner functions

/**
 * Scan a sales ticket and get AI product suggestions
 * @param file Image file of the sales ticket
 * @returns Suggested products and metadata
 */
export async function scanSalesTicket(file: File): Promise<ScannedSaleData> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('language', 'spa')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY || ''

  const response = await fetch(`${apiUrl}/sales/scan`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de red' }))
    throw new Error(error.error || 'Error al escanear el ticket')
  }

  return response.json()
}

/**
 * Check if the sales AI scanner is available
 * @returns Scanner availability status
 */
export async function getSalesScannerStatus(): Promise<SalesScannerStatus> {
  return fetchAPI<SalesScannerStatus>('/sales/scan/status', {}, true)
}
