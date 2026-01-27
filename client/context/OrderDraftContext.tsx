"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"
import { Product } from "@/lib/api"

export type OrderItem = Product & {
  quantity: number
}

interface OrderDraftContextType {
  items: OrderItem[]
  pickupTime: string
  customerName: string
  addItem: (product: Product) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, delta: number) => void
  setPickupTime: (time: string) => void
  setCustomerName: (name: string) => void
  resetOrder: () => void
  total: number
}

const OrderDraftContext = createContext<OrderDraftContextType | undefined>(undefined)

export function OrderDraftProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>([])
  const [pickupTime, setPickupTime] = useState("")
  const [customerName, setCustomerName] = useState("")

  const addItem = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === product.id)
      if (existing) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((p) => p.id !== productId))
  }

  const updateQuantity = (productId: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((p) => (p.id === productId ? { ...p, quantity: p.quantity + delta } : p))
        .filter((p) => p.quantity > 0)
    )
  }

  const resetOrder = () => {
    setItems([])
    setPickupTime("")
    setCustomerName("")
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = items.length > 0 ? parseFloat((subtotal + 0.10).toFixed(2)) : 0

  return (
    <OrderDraftContext.Provider
      value={{
        items,
        pickupTime,
        customerName,
        addItem,
        removeItem,
        updateQuantity,
        setPickupTime,
        setCustomerName,
        resetOrder,
        total,
      }}
    >
      {children}
    </OrderDraftContext.Provider>
  )
}

export function useOrderDraft() {
  const context = useContext(OrderDraftContext)
  if (context === undefined) {
    throw new Error("useOrderDraft must be used within a OrderDraftProvider")
  }
  return context
}
