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

