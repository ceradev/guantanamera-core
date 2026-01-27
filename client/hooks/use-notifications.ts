import { useEffect, useRef } from 'react'
import { notificationService } from '@/services/notification.service'

export interface NotificationCallbacks {
  onOrdersUpdated?: () => void
  onSettingsUpdated?: () => void
  onProductsUpdated?: () => void
}

export function useNotifications(callbacks: NotificationCallbacks) {
  // Usar refs para evitar reconexiones innecesarias si los callbacks cambian de referencia
  const callbacksRef = useRef(callbacks)
  
  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  useEffect(() => {
    const unsubscribers: (() => void)[] = []

    if (callbacks.onOrdersUpdated) {
      unsubscribers.push(notificationService.subscribe('ORDERS_UPDATED', () => callbacksRef.current.onOrdersUpdated?.()))
    }
    if (callbacks.onSettingsUpdated) {
      unsubscribers.push(notificationService.subscribe('SETTINGS_UPDATED', () => callbacksRef.current.onSettingsUpdated?.()))
    }
    if (callbacks.onProductsUpdated) {
      unsubscribers.push(notificationService.subscribe('PRODUCTS_UPDATED', () => callbacksRef.current.onProductsUpdated?.()))
    }

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [
    !!callbacks.onOrdersUpdated,
    !!callbacks.onSettingsUpdated,
    !!callbacks.onProductsUpdated
  ])
}
