import { useState } from 'react'
import type { WizardStep, CreateOrderPageProps } from '@/types'

export function useCreateOrderWizard({ onOrderCreated }: CreateOrderPageProps) {
  const [step, setStep] = useState<WizardStep>('products')

  const goProducts = () => setStep('products')
  const goTime = () => setStep('time')
  const goCustomer = () => setStep('customer')

  const handleFinish = () => {
    if (onOrderCreated) {
      onOrderCreated()
    } else {
      goProducts()
    }
  }

  return {
    step,
    setStep,
    goProducts,
    goTime,
    goCustomer,
    handleFinish,
  }
}

