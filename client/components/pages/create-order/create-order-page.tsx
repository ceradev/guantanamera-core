"use client"

import { OrderDraftProvider } from "@/context/OrderDraftContext"
import { StepProducts, StepTime, StepCustomer } from "@/components/pages/create-order/components"
import { Check, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CreateOrderPageProps } from "@/types"
import { useCreateOrderWizard } from "@/hooks/use-create-order-wizard"
import { useSettings } from "@/hooks/use-settings"
import { isShopOpen } from "@/utils/timeSlots"

function CreateOrderWizard(props: CreateOrderPageProps) {
  const { step, goTime, goProducts, goCustomer, handleFinish } = useCreateOrderWizard(props)
  const { ordersEnabled, isLoading, weeklySchedule } = useSettings()

  const renderStep = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
        </div>
      )
    }

    const shopOpen = isShopOpen(weeklySchedule)

    if (!ordersEnabled || !shopOpen) {
      const now = new Date()
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Atlantic/Canary",
        weekday: "long"
      })
      const weekdayName = formatter.format(now)
      const dayMap: Record<string, number> = {
        "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6
      }
      const currentDay = dayMap[weekdayName]
      const todaySchedule = weeklySchedule?.find((s: any) => s.day === currentDay)

      let title = "Establecimiento Cerrado"
      let message = ""

      if (!ordersEnabled) {
        title = "Pedidos Desactivados"
        message = "La recepción de pedidos está desactivada actualmente por el administrador."
      } else if (!todaySchedule || !todaySchedule.enabled) {
        title = "Hoy estamos cerrados"
        message = "El establecimiento permanece cerrado el día de hoy por descanso semanal o festivo."
      } else {
        title = "Fuera de Horario"
        message = `Nuestro horario de atención para hoy es de ${todaySchedule.open} a ${todaySchedule.close}.`
      }

      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <div className="max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {title}
            </h2>
            <p className="text-gray-500 text-lg">
              {message}
            </p>
            <p className="text-gray-400 mt-4">
              Por favor, vuelve a intentarlo dentro del horario comercial.
            </p>
          </div>
        </div>
      )
    }

    switch (step) {
      case "products":
        return <StepProducts onNext={goTime} />
      case "time":
        return <StepTime onNext={goCustomer} onBack={goProducts} />
      case "customer":
        return (
          <StepCustomer
            onBack={goTime}
            onFinish={handleFinish}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Enhanced Header */}
      <header className="bg-white border-b px-4 md:px-8 py-6 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">Nuevo Pedido</h1>
          <p className="text-muted-foreground mt-1 text-base md:text-lg truncate">Sigue los pasos para crear una orden</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 lg:gap-4 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 scrollbar-hide">
          {[
            { id: "products", label: "Productos", short: "1" },
            { id: "time", label: "Hora", short: "2" },
            { id: "customer", label: "Cliente", short: "3" }
          ].map((s, idx) => {
            const isActive = step === s.id
            const isCompleted =
              (step === "time" && s.id === "products") ||
              (step === "customer" && (s.id === "products" || s.id === "time"))

            return (
              <div key={s.id} className="flex items-center gap-2 lg:gap-4 shrink-0">
                <div className={`
                  flex items-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-full text-sm lg:text-base font-bold transition-all
                  ${isActive ? "bg-red-600 text-white shadow-md" :
                    isCompleted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}
                `}>
                  {isCompleted ? <Check className="w-4 h-4" /> : <span className="lg:hidden">{s.short}.</span>}
                  <span className={cn("hidden lg:inline", isActive && "inline")}>{s.label}</span>
                </div>
                {idx < 2 && <div className="w-6 lg:w-12 h-px bg-gray-200" />}
              </div>
            )
          })}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {renderStep()}
      </div>
    </div>
  )
}

export default function CreateOrderPage(props: CreateOrderPageProps) {
  return (
    <OrderDraftProvider>
      <CreateOrderWizard {...props} />
    </OrderDraftProvider>
  )
}
