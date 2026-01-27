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
export async function getSales(type: SalesPeriod, date?: string): Promise<SalesAggregate> {
  const params = new URLSearchParams({ type })
  if (date) params.append('date', date)
  return fetchAPI<SalesAggregate>(`/sales?${params.toString()}`, {}, true)
}

