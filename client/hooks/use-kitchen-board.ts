import { useEffect, useRef, useState } from 'react'
import { getOrders, updateOrderStatus } from '@/services'
import type { Order as ApiOrder } from '@/types'
import type { KitchenOrder } from '@/types/kitchen'
import { isOrderDelayedKitchen } from '@/utils/kitchen'
import { handleApiError } from '@/utils/handleApiError'
import { playChime, startAlertLoop, stopAlertLoop } from '@/utils/audio'
import { useNotifications } from '@/hooks/use-notifications'

export function useKitchenBoard() {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [hasError, setHasError] = useState(false)
  const errorToastShownRef = useRef(false)
  const prevIdsRef = useRef<Set<number>>(new Set())
  const newReceivedRef = useRef<Set<number>>(new Set())
  const closingHour = 23

  const fetchOrders = async () => {
    try {
      const response = await getOrders(undefined, 1, 50)
      const apiOrders = response.data.filter((o: ApiOrder) => ['RECEIVED', 'PREPARING'].includes(o.status))
      const mappedOrders: KitchenOrder[] = apiOrders.map((o: ApiOrder) => {
        let isNew = false
        if (o.status === 'RECEIVED') {
          if (!prevIdsRef.current.has(o.id) || newReceivedRef.current.has(o.id)) {
            isNew = true
            newReceivedRef.current.add(o.id)
          }
        } else {
          newReceivedRef.current.delete(o.id)
        }
        return {
          id: o.id,
          number: `#${o.id.toString().padStart(3, '0')}`,
          pickupTime: o.pickupTime,
          status: o.status as 'RECEIVED' | 'PREPARING' | 'READY',
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          items: o.items.map((i) => ({ name: i.name, quantity: i.quantity })),
          isDelayed: isOrderDelayedKitchen(o.pickupTime, o.status),
          isNew,
        }
      })

      mappedOrders.sort((a, b) => {
        if (a.isDelayed && !b.isDelayed) return -1
        if (!a.isDelayed && b.isDelayed) return 1
        if ((a.isNew ? 1 : 0) !== (b.isNew ? 1 : 0)) return a.isNew ? -1 : 1
        return a.pickupTime.localeCompare(b.pickupTime)
      })

      setOrders(mappedOrders)
      const newIds = mappedOrders.filter((o) => o.isNew).map((o) => o.id)
      if (newIds.length > 0) {
        playChime(1.2)
      }
      const anyReceived = mappedOrders.some((o) => o.status === 'RECEIVED')
      if (anyReceived) {
        startAlertLoop('/sounds/new-order.mp3', 1.0)
      } else {
        stopAlertLoop()
      }
      prevIdsRef.current = new Set(mappedOrders.map((o) => o.id))
    } catch (error) {
      setHasError(true)
      if (!errorToastShownRef.current) {
        handleApiError(error, 'los pedidos')
        errorToastShownRef.current = true
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      stopAlertLoop()
    }
  }, [])

  useNotifications({ onOrdersUpdated: fetchOrders })

  const handleStatusChange = async (orderId: number, currentStatus: string) => {
    try {
      let nextStatus = ''
      if (currentStatus === 'RECEIVED') nextStatus = 'PREPARING'
      if (currentStatus === 'PREPARING') nextStatus = 'READY'
      if (!nextStatus) return

      setOrders((prev) =>
        prev
          .map((o) => (o.id === orderId ? { ...o, status: nextStatus as any, isNew: false } : o))
          .filter((o) => o.status !== 'READY'),
      )

      await updateOrderStatus(orderId, nextStatus)
      fetchOrders()
      setOrders((prev) => {
        const anyReceived = prev.some((o) => o.status === 'RECEIVED')
        if (!anyReceived) stopAlertLoop()
        return prev
      })
      if (nextStatus === 'PREPARING') {
        newReceivedRef.current.delete(orderId)
      }
    } catch (error) {
      setHasError(true)
      if (!errorToastShownRef.current) {
        handleApiError(error, 'el pedido')
        errorToastShownRef.current = true
      }
      fetchOrders()
    }
  }

  const receivedOrders = orders.filter((o) => o.status === 'RECEIVED')
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING')

  return {
    orders,
    isLoading,
    isOnline,
    hasError,
    closingHour,
    fetchOrders,
    handleStatusChange,
    receivedOrders,
    preparingOrders,
  }
}
