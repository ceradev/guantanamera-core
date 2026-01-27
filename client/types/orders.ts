export interface OrderItem {
  productId: number
  name: string
  quantity: number
  price?: number
}

export interface Order {
  id: number
  status: 'RECEIVED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
  customerName?: string
  customerPhone?: string
  pickupTime: string
  total: number
  createdAt: string
  items: OrderItem[]
}

export interface CreateOrderPayload {
  customerName: string
  customerPhone?: string
  pickupTime: string
  items: { name: string; quantity: number }[]
}
