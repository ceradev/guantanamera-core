"use client"

import React from "react"
import { Badge } from "@/components/ui/data-display/badge"
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core"
import { ErrorState } from "@/components/states/ErrorState"
import Skeleton from "react-loading-skeleton"
import type { OrdersPageProps, OrderStatus } from "@/types/orders-view"
import { SortableOrderCard } from "./components/SortableOrderCard"
import { DroppableColumn } from "./components/DroppableColumn"
import { useOrdersBoard } from "@/hooks/use-orders-board"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/navigation/tabs"

export default function OrdersPage({ onNewOrderCountChange }: OrdersPageProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const {
    orders,
    activeId,
    isRefreshing,
    hasError,
    initialLoading,
    fetchOrders,
    handleDragStart,
    handleDragEnd,
    updateOrderStatus,
    markAsDelivered,
    handleCancelOrder,
  } = useOrdersBoard(onNewOrderCountChange)

  const [activeTab, setActiveTab] = React.useState<OrderStatus>("received")

  // No spinner: skeleton solo para carga inicial de tablero

  if (hasError) {
    return (
      <div className="flex-1 p-8">
        <ErrorState
          title="No se pueden cargar los pedidos"
          description="El servidor no está disponible en este momento."
          onRetry={fetchOrders}
        />
      </div>
    )
  }

  if (initialLoading && isRefreshing) {
    return (
      <div className="h-full flex flex-col bg-gray-50/50 relative">
        <header className="bg-white border-b px-4 md:px-8 py-6 shrink-0 flex items-center justify-between">
          <div>
            <Skeleton width={240} height={36} />
            <Skeleton width={320} height={20} className="mt-2" />
          </div>
          <div className="hidden lg:flex gap-3">
            <Skeleton width={100} height={24} />
            <Skeleton width={100} height={24} />
            <Skeleton width={100} height={24} />
          </div>
        </header>
        <div className="flex-1 overflow-hidden p-4 md:p-6">
          {/* Mobile/Tablet Skeleton */}
          <div className="lg:hidden">
            <Skeleton height={40} className="mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border shadow-sm p-4">
                  <Skeleton width={100} height={24} />
                  <div className="mt-2 space-y-2">
                    <Skeleton height={16} count={3} />
                  </div>
                  <div className="mt-3">
                    <Skeleton width={"50%"} height={28} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Desktop Skeleton */}
          <div className="hidden lg:grid grid-cols-3 gap-6 h-full min-h-0">
            {["Recibidos", "Preparando", "Listos"].map((_, idx) => (
              <div key={idx} className="flex flex-col h-full min-h-0 bg-white rounded-2xl border border-gray-200">
                <div className="p-3 border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
                  <Skeleton width={120} height={20} />
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-xl border shadow-sm p-4">
                        <Skeleton width={100} height={24} />
                        <div className="mt-2 space-y-2">
                          <Skeleton height={16} count={3} />
                        </div>
                        <div className="mt-3">
                          <Skeleton width={"50%"} height={28} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const activeOrder = activeId ? orders.find((order) => order.id === activeId) : null

  const receivedOrders = orders.filter((order) => order.status === "received")
  const preparingOrders = orders.filter((order) => order.status === "preparing")
  const readyOrders = orders.filter((order) => order.status === "ready")

  return (
    <div className="h-full flex flex-col bg-gray-50/50 relative">
      {/* Top Bar Header */}
      <header className="bg-white border-b px-4 md:px-8 py-6 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-muted-foreground mt-1 text-base md:text-lg">Gestiona el flujo de pedidos</p>
        </div>

        <div className="hidden lg:flex gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-xs font-bold text-gray-600 uppercase">Recibidos</span>
            <span className="text-sm font-black text-gray-900 ml-1">{receivedOrders.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-100">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-700 uppercase">Cocina</span>
            <span className="text-sm font-black text-red-900 ml-1">{preparingOrders.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-100">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-bold text-green-700 uppercase">Listos</span>
            <span className="text-sm font-black text-green-900 ml-1">{readyOrders.length}</span>
          </div>
        </div>
      </header>

      {/* Mobile/Tablet Tabs */}
      <div className="lg:hidden p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OrderStatus)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="received" className="text-xs font-bold px-1">Recibidos ({receivedOrders.length})</TabsTrigger>
            <TabsTrigger value="preparing" className="text-xs font-bold px-1">Preparando ({preparingOrders.length})</TabsTrigger>
            <TabsTrigger value="ready" className="text-xs font-bold px-1">Listos ({readyOrders.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="received" className="mt-6">
            <div className="space-y-4">
              {receivedOrders.map((order) => (
                <SortableOrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} onMarkDelivered={markAsDelivered} onCancel={handleCancelOrder} />
              ))}
              {receivedOrders.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed">
                  No hay pedidos recibidos
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="preparing" className="mt-6">
            <div className="space-y-4">
              {preparingOrders.map((order) => (
                <SortableOrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} onMarkDelivered={markAsDelivered} onCancel={handleCancelOrder} />
              ))}
              {preparingOrders.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed">
                  No hay pedidos en preparación
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="ready" className="mt-6">
            <div className="space-y-4">
              {readyOrders.map((order) => (
                <SortableOrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} onMarkDelivered={markAsDelivered} onCancel={handleCancelOrder} />
              ))}
              {readyOrders.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed">
                  No hay pedidos listos
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Kanban Board */}
      <div className="hidden lg:flex flex-1 flex-col overflow-hidden p-6">
        <DndContext
          id="orders-dnd-context"
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-3 gap-6 h-full">
            {/* Received Column */}
            <div className="flex flex-col h-full bg-gray-100/50 rounded-2xl border border-gray-200">
              <div className="p-3 border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  Recibidos
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                <DroppableColumn id="received" isOver={activeId !== null}>
                  {receivedOrders.map((order) => (
                    <SortableOrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} onMarkDelivered={markAsDelivered} onCancel={handleCancelOrder} />
                  ))}
                </DroppableColumn>
              </div>
            </div>

            {/* Preparing Column */}
            <div className="flex flex-col h-full bg-red-50/50 rounded-2xl border border-red-200">
              <div className="p-3 border-b border-red-200 bg-red-50/80 backdrop-blur-sm rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-sm font-black text-red-500 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  Preparando
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                <DroppableColumn id="preparing" isOver={activeId !== null}>
                  {preparingOrders.map((order) => (
                    <SortableOrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} onMarkDelivered={markAsDelivered} onCancel={handleCancelOrder} />
                  ))}
                </DroppableColumn>
              </div>
            </div>

            {/* Ready Column */}
            <div className="flex flex-col h-full bg-green-50/50 rounded-2xl border border-green-200">
              <div className="p-3 border-b border-green-200 bg-green-50/80 backdrop-blur-sm rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-sm font-black text-green-600 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Listos
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                <DroppableColumn id="ready" isOver={activeId !== null}>
                  {readyOrders.map((order) => (
                    <SortableOrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} onMarkDelivered={markAsDelivered} onCancel={handleCancelOrder} />
                  ))}
                </DroppableColumn>
              </div>
            </div>
          </div>
          <DragOverlay>
            {activeOrder ? <SortableOrderCard order={activeOrder} onUpdateStatus={() => {}} onMarkDelivered={() => {}} onCancel={() => {}} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
