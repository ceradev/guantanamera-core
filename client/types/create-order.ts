export type WizardStep = 'products' | 'time' | 'customer'

export interface CreateOrderPageProps {
  onOrderCreated?: () => void
}

