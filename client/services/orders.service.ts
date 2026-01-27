import { fetchAPI } from '@/lib/api'
import type { CreateOrderPayload, Order, PaginatedResponse } from '@/types'

/**
 * Crea un nuevo pedido.
 * @param payload Datos del pedido.
 * @returns Pedido creado.
 */
export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  return fetchAPI<Order>('/orders', { method: 'POST', body: JSON.stringify(payload) })
}

/**
 * Obtiene pedidos con paginación.
 * @param status Estado opcional para filtrar.
 * @param page Página a solicitar.
 * @param limit Límite por página.
 * @returns Respuesta paginada de pedidos.
 */
export async function getOrders(status?: string, page: number = 1, limit: number = 50): Promise<PaginatedResponse<Order>> {
  const queryParams = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) queryParams.append('status', status)
  return fetchAPI<PaginatedResponse<Order>>(`/orders?${queryParams.toString()}`, {}, true)
}

/**
 * Obtiene un pedido por ID.
 * @param id Identificador del pedido.
 * @returns Pedido encontrado.
 */
export async function getOrderById(id: number): Promise<Order> {
  return fetchAPI<Order>(`/orders/${id}`, {}, true)
}

/**
 * Actualiza el estado de un pedido.
 * @param id Identificador del pedido.
 * @param status Nuevo estado.
 * @returns Pedido actualizado.
 */
export async function updateOrderStatus(id: number, status: string): Promise<Order> {
  return fetchAPI<Order>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, true)
}

