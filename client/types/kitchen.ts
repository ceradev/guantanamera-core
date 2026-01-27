export type KitchenOrder = {
  id: number
  number: string
  pickupTime: string
  status: 'RECEIVED' | 'PREPARING' | 'READY'
  customerName?: string
  customerPhone?: string
  items: { name: string; quantity: number }[]
  isNew?: boolean
  isDelayed?: boolean
}

export interface KitchenPageProps {
  onExit?: () => void
}

