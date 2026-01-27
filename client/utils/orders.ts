import type { Order, OrderStatus } from '@/types/orders-view'
import type { Order as ApiOrder } from '@/types'

export const isOrderDelayed = (pickupTime: string, status: OrderStatus): boolean => {
  if (status === 'ready' || status === 'delivered' || status === 'cancelled') return false
  const now = new Date()
  const [hours, minutes] = pickupTime.split(':').map(Number)
  const pickupDate = new Date()
  pickupDate.setHours(hours, minutes, 0, 0)
  return now.getTime() > pickupDate.getTime() + 5 * 60000
}

export const mapApiOrderToOrder = (apiOrder: ApiOrder): Order => {
  const status = apiOrder.status.toLowerCase() as OrderStatus
  return {
    id: apiOrder.id.toString(),
    number: `#${apiOrder.id.toString().padStart(3, '0')}`,
    pickupTime: apiOrder.pickupTime,
    customerName: apiOrder.customerName,
    customerPhone: apiOrder.customerPhone,
    status,
    products: apiOrder.items.map((item) => ({
      id: item.productId.toString(),
      name: item.name,
      quantity: item.quantity,
      price: item.price || 0,
    })),
    total: apiOrder.total,
    isNew: false,
    isDelayed: isOrderDelayed(apiOrder.pickupTime, status),
  }
}

export const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case 'received':
      return { label: 'RECIBIDO', color: 'bg-gray-100 text-gray-700 border-gray-200', accent: 'border-l-4 border-l-gray-400' }
    case 'preparing':
      return { label: 'PREPARANDO', color: 'bg-red-50 text-red-700 border-red-100', accent: 'border-l-4 border-l-red-500' }
    case 'ready':
      return { label: 'LISTO', color: 'bg-green-50 text-green-700 border-green-100', accent: 'border-l-4 border-l-green-500' }
    default:
      return { label: status, color: 'bg-gray-100', accent: '' }
  }
}
