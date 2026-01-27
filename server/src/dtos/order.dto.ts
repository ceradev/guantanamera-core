import type { OrderItemDTO } from "./order-item.dto"

export type OrderStatusDTO = "RECEIVED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED"

export interface OrderDTO {
  id: number
  status: OrderStatusDTO
  total?: number
  createdAt?: string
  customerName?: string
  customerPhone?: string
  pickupTime?: string
  items?: OrderItemDTO[]
}

export interface PaginatedResponseDTO<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateOrderRequestDTO {
  customerName: string
  pickupTime: string
  items: { name: string; quantity: number }[]
  customerPhone?: string
}
