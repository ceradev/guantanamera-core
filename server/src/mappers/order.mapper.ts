import type { OrderDTO, OrderStatusDTO, PaginatedResponseDTO } from "../dtos/order.dto.js"
import { mapOrderItemToDTO } from "./order-item.mapper.js"

type OrderWithItems = {
  id: number
  status: OrderStatusDTO
  customerName?: string
  customerPhone?: string
  pickupTime?: string
  total: number
  createdAt: Date
  items: { productId: number; quantity: number; price: number; product: { name: string } }[]
}

export function mapOrderToDTO(order: OrderWithItems | { id: number; status: OrderStatusDTO; total?: number; createdAt?: Date; customerName?: string; customerPhone?: string; pickupTime?: string; items?: any[] }): OrderDTO {
  return {
    id: order.id,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt ? order.createdAt.toISOString() : undefined,
    customerName: order.customerName,
    customerPhone: (order as any).customerPhone,
    pickupTime: order.pickupTime,
    items: Array.isArray(order.items) ? order.items.map(mapOrderItemToDTO) : undefined,
  }
}

export function mapPaginatedOrdersToDTO(input: { data: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }): PaginatedResponseDTO<OrderDTO> {
  return {
    data: input.data.map(mapOrderToDTO),
    pagination: input.pagination,
  }
}
