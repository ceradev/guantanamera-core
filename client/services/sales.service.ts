import { fetchAPI } from '@/lib/api'
import type { SalesAggregate, SalesPeriod, TodaySales } from '@/types'

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
 * @returns Agregado de ventas.
 */
export async function getSales(type: SalesPeriod, date?: string, source?: string): Promise<SalesAggregate> {
  const params = new URLSearchParams({ type })
  if (date) params.append('date', date)
  if (source) params.append('source', source)
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

