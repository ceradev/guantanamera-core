export type OrderStatus = 'received' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

export type Product = {
  id: string
  name: string
  quantity: number
  price: number
}

export type Order = {
  id: string
  number: string
  pickupTime: string
  customerName?: string
  customerPhone?: string
  status: OrderStatus
  products: Product[]
  total: number
  deliveredAt?: Date
  isNew?: boolean
  isDelayed?: boolean
}

export type DeliveredOrder = Order & { deliveredAt: Date }

export interface OrdersPageProps {
  onNewOrderCountChange?: (count: number) => void
}
