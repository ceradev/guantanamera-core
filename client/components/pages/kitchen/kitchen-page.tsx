"use client"

import { useKitchenBoard } from "@/hooks/use-kitchen-board"
import { KitchenCard } from "@/components/pages/kitchen/components/KitchenCard"
import type { KitchenPageProps } from "@/types/kitchen"
import { ErrorState } from "@/components/states/ErrorState"
import Skeleton from "react-loading-skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/navigation/tabs"
import { useState } from "react"

export default function KitchenPage({ onExit }: KitchenPageProps) {
  const [activeTab, setActiveTab] = useState<"received" | "preparing">("received")
  const {
    isLoading,
    isOnline,
    hasError,
    closingHour,
    fetchOrders,
    handleStatusChange,
    receivedOrders,
    preparingOrders,
  } = useKitchenBoard()

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

  if (isLoading) {
    return (
      <div className="relative flex flex-col h-screen bg-gray-100 overflow-hidden font-sans">
        <div className="absolute top-4 right-4 z-30">
          <Skeleton width={160} height={40} />
        </div>
        <div className="absolute top-4 left-4 z-30 flex items-center gap-3">
          <Skeleton width={80} height={24} />
          <Skeleton width={120} height={24} />
        </div>
        <div className="flex-1 overflow-hidden flex divide-x divide-gray-300">
          <div className="flex-1 flex flex-col min-w-0 bg-gray-200/50">
            <div className="bg-gray-300 px-6 py-3">
              <Skeleton width={180} height={24} />
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 xl:grid-cols-2 gap-4 content-start">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col bg-white rounded-none border-l-12 shadow-sm p-5 h-full relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-dashed border-gray-100">
                    <div className="w-full">
                      <div className="flex justify-between items-start">
                        <Skeleton width={120} height={40} />
                        <Skeleton width={100} height={28} />
                      </div>
                      <Skeleton width={200} height={20} className="mt-2" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-4 mb-6">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="flex items-start gap-4">
                        <Skeleton width={56} height={28} />
                        <Skeleton width={"60%"} height={20} />
                      </div>
                    ))}
                  </div>
                  <Skeleton width={"100%"} height={48} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col min-w-0 bg-red-50/30">
            <div className="bg-red-100 px-6 py-3">
              <Skeleton width={180} height={24} />
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 xl:grid-cols-2 gap-4 content-start">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col bg-white rounded-none border-l-12 shadow-sm p-5 h-full relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-dashed border-gray-100">
                    <div className="w-full">
                      <div className="flex justify-between items-start">
                        <Skeleton width={120} height={40} />
                        <Skeleton width={100} height={28} />
                      </div>
                      <Skeleton width={200} height={20} className="mt-2" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-4 mb-6">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="flex items-start gap-4">
                        <Skeleton width={56} height={28} />
                        <Skeleton width={"60%"} height={20} />
                      </div>
                    ))}
                  </div>
                  <Skeleton width={"100%"} height={48} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Lógica y componentes extraídos; aquí solo se renderiza usando el hook

  return (
    <div className="relative flex flex-col h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col h-full">
        <header className="bg-white border-b px-4 py-3 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isOnline && (
              <span className="px-2 py-1 rounded-full bg-red-600 text-white text-xs font-bold shadow-sm">
                Offline
              </span>
            )}
            {(new Date().getHours() >= closingHour) && (
              <span className="px-2 py-1 rounded-full bg-gray-900 text-white text-xs font-bold shadow-sm">
                Cerrado
              </span>
            )}
          </div>
          <button
            onClick={onExit}
            className="px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-md font-bold hover:bg-black"
          >
            Salir
          </button>
        </header>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "received" | "preparing")} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-4 shrink-0">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="received" className="text-base font-bold relative">
                Nuevos
                {receivedOrders.length > 0 && (
                  <span className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {receivedOrders.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="preparing" className="text-base font-bold relative">
                En Proceso
                {preparingOrders.length > 0 && (
                  <span className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {preparingOrders.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="received" className="flex-1 overflow-y-auto p-4 mt-0">
            <div className="space-y-4 pb-20">
              {receivedOrders.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-4">
                  <p className="text-gray-900 font-bold text-xl uppercase tracking-widest">No hay pedidos</p>
                  <p className="text-gray-500 mt-2">Los nuevos pedidos aparecerán aquí</p>
                </div>
              ) : (
                receivedOrders.map(order => (
                  <div key={order.id} className="h-auto">
                    <KitchenCard order={order} onAdvance={handleStatusChange} />
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="preparing" className="flex-1 overflow-y-auto p-4 mt-0">
            <div className="space-y-4 pb-20">
              {preparingOrders.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-4">
                  <p className="text-gray-900 font-bold text-xl uppercase tracking-widest">Cocina libre</p>
                  <p className="text-gray-500 mt-2">No hay pedidos en preparación</p>
                </div>
              ) : (
                preparingOrders.map(order => (
                  <div key={order.id} className="h-auto">
                    <KitchenCard order={order} onAdvance={handleStatusChange} />
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden flex-col relative h-full">
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={onExit}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg shadow-md font-bold hover:bg-black"
          >
            Salir Modo Cocina
          </button>
        </div>
        <div className="absolute top-4 left-4 z-30 flex items-center gap-3">
          {!isOnline && (
            <span className="px-3 py-1 rounded-full bg-red-600 text-white text-sm font-bold shadow-sm">
              Offline
            </span>
          )}
          {(new Date().getHours() >= closingHour) && (
            <span className="px-3 py-1 rounded-full bg-gray-900 text-white text-sm font-bold shadow-sm">
              Cocina cerrada
            </span>
          )}
        </div>

        <div className="flex-1 overflow-hidden flex divide-x divide-gray-300">
          {/* Column: RECEIVED */}
          <div className="flex-1 flex flex-col min-w-0 bg-gray-200/50">
            <div className="bg-gray-300 px-6 py-3 font-black text-gray-600 uppercase tracking-widest text-lg sticky top-0 z-10">
              Nuevos Pedidos
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 xl:grid-cols-2 gap-4 content-start">
              {receivedOrders.length === 0 ? (
                <div className="col-span-full h-64 flex items-center justify-center text-gray-900 font-bold text-2xl uppercase tracking-widest">
                  No hay pedidos en este momento
                </div>
              ) : (
                receivedOrders.map(order => (
                  <KitchenCard key={order.id} order={order} onAdvance={handleStatusChange} />
                ))
              )}
            </div>
          </div>

          {/* Column: PREPARING */}
          <div className="flex-1 flex flex-col min-w-0 bg-red-50/30">
            <div className="bg-red-100 px-6 py-3 font-black text-red-700 uppercase tracking-widest text-lg sticky top-0 z-10">
              En Preparación
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 xl:grid-cols-2 gap-4 content-start">
              {preparingOrders.length === 0 ? (
                <div className="col-span-full h-64 flex items-center justify-center text-red-700 font-bold text-2xl uppercase tracking-widest">
                  Cocina libre
                </div>
              ) : (
                preparingOrders.map(order => (
                  <KitchenCard key={order.id} order={order} onAdvance={handleStatusChange} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
