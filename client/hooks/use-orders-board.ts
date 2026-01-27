import { useEffect, useRef, useState } from 'react'
import { getOrders, updateOrderStatus as apiUpdateOrderStatus } from '@/services'
import type { Order as ApiOrder } from '@/types'
import type { Order, OrderStatus } from '@/types/orders-view'
import { isOrderDelayed, mapApiOrderToOrder } from '@/utils/orders'
import { handleApiError } from '@/utils/handleApiError'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { playChime, startAlertLoop, stopAlertLoop } from '@/utils/audio'
import { useNotifications } from '@/hooks/use-notifications'

export function useOrdersBoard(onNewOrderCountChange?: (count: number) => void) {
  const [orders, setOrders] = useState<Order[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const errorToastShownRef = useRef(false)
  const prevIdsRef = useRef<Set<string>>(new Set())
  const newReceivedRef = useRef<Set<string>>(new Set())

  const [settings, setSettings] = useState({ autoRefresh: true, refreshInterval: 10 })

  const fetchOrders = async () => {
    try {
      setIsRefreshing(true)
      const response = await getOrders(undefined, 1, 50)
      const apiOrders = response.data
      const activeApiOrders = apiOrders.filter((o: ApiOrder) => ['RECEIVED', 'PREPARING', 'READY'].includes(o.status))
      const mappedOrders = activeApiOrders.map((o) => {
        const mapped = mapApiOrderToOrder(o)
        let isNew = false
        if (mapped.status === 'received') {
          if (!prevIdsRef.current.has(mapped.id) || newReceivedRef.current.has(mapped.id)) {
            isNew = true
            newReceivedRef.current.add(mapped.id)
          }
        } else {
          newReceivedRef.current.delete(mapped.id)
        }
        return { ...mapped, isNew }
      })
      mappedOrders.sort((a, b) => {
        if ((a.isNew ? 1 : 0) !== (b.isNew ? 1 : 0)) return a.isNew ? -1 : 1
        if (a.isDelayed && !b.isDelayed) return -1
        if (!a.isDelayed && b.isDelayed) return 1
        return a.pickupTime.localeCompare(b.pickupTime)
      })
      setOrders(mappedOrders)
      const newIds = mappedOrders.filter((o) => o.isNew).map((o) => o.id)
      if (newIds.length > 0) {
        playChime(1.2)
      }
      const anyReceived = mappedOrders.some((o) => o.status === 'received')
      if (anyReceived) {
        startAlertLoop('/sounds/new-order.mp3', 1.0)
      } else {
        stopAlertLoop()
      }
      prevIdsRef.current = new Set(mappedOrders.map((o) => o.id))
      const inProgressCount = activeApiOrders.filter((o: ApiOrder) => ['RECEIVED', 'PREPARING'].includes(o.status)).length
      onNewOrderCountChange?.(inProgressCount)
      setHasError(false)
      errorToastShownRef.current = false
    } catch (error) {
      setHasError(true)
      if (!errorToastShownRef.current) {
        handleApiError(error, 'los pedidos')
        errorToastShownRef.current = true
      }
    } finally {
      setIsRefreshing(false)
      if (initialLoading) setInitialLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    return () => {
      stopAlertLoop()
    }
  }, [])

  useNotifications({ onOrdersUpdated: fetchOrders })

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const isNowDelayed = isOrderDelayed(order.pickupTime, newStatus)
          return { ...order, status: newStatus, isNew: false, isDelayed: isNowDelayed }
        }
        return order
      }),
    )
    if (newStatus === 'preparing') {
      newReceivedRef.current.delete(orderId)
    }

    try {
      await apiUpdateOrderStatus(parseInt(orderId), newStatus.toUpperCase())
      const response = await getOrders(undefined, 1, 50)
      const apiOrders = response.data
      const inProgressCount = apiOrders.filter((o: ApiOrder) => ['RECEIVED', 'PREPARING'].includes(o.status)).length
      onNewOrderCountChange?.(inProgressCount)
      setOrders((prev) => {
        const anyReceived = prev.some((o) => o.status === 'received')
        if (!anyReceived) stopAlertLoop()
        return prev
      })
    } catch (error) {
      handleApiError(error, 'el pedido')
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const orderId = active.id as string
    const newStatus = over.id as OrderStatus
    if (['received', 'preparing', 'ready'].includes(newStatus)) {
      updateOrderStatus(orderId, newStatus)
    }
  }

  const markAsDelivered = async (orderId: string) => {
    try {
      await apiUpdateOrderStatus(parseInt(orderId), 'DELIVERED')
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
      const response = await getOrders(undefined, 1, 50)
      const apiOrders = response.data
      const inProgressCount = apiOrders.filter((o: ApiOrder) => ['RECEIVED', 'PREPARING'].includes(o.status)).length
      onNewOrderCountChange?.(inProgressCount)
    } catch (error) {
      console.error('Failed to mark as delivered', error)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    try {
      await apiUpdateOrderStatus(parseInt(orderId), 'CANCELLED')
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
      newReceivedRef.current.delete(orderId)
      const response = await getOrders(undefined, 1, 50)
      const apiOrders = response.data
      const inProgressCount = apiOrders.filter((o: ApiOrder) => ['RECEIVED', 'PREPARING'].includes(o.status)).length
      onNewOrderCountChange?.(inProgressCount)
    } catch (error) {
      handleApiError(error, 'el pedido')
    }
  }

  return {
    orders,
    activeId,
    isRefreshing,
    hasError,
    initialLoading,
    settings,
    setSettings,
    fetchOrders,
    handleDragStart,
    handleDragEnd,
    updateOrderStatus,
    markAsDelivered,
    handleCancelOrder,
  }
}

