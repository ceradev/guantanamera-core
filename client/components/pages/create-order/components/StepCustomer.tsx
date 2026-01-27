"use client"

import { useState } from "react"
import { useOrderDraft } from "@/context/OrderDraftContext"
import { createOrder as apiCreateOrder } from "@/services"
import { Button } from "@/components/ui/buttons/button"
import { VirtualKeyboard } from "@/components/pages/create-order/components"
import { Input } from "@/components/ui/inputs/input"
import { ChevronLeft, Check, User } from "lucide-react"
import { handleApiError } from "@/utils/handleApiError"

interface StepCustomerProps {
  onBack: () => void
  onFinish: () => void
}

export function StepCustomer({ onBack, onFinish }: StepCustomerProps) {
  const { items, pickupTime, customerName, setCustomerName, total, resetOrder } = useOrderDraft()
  const [activeField, setActiveField] = useState<"name" | "phone">("name")
  const [customerPhone, setCustomerPhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleKeyPress = (key: string) => {
    if (activeField === "name") {
      setCustomerName(customerName + key)
    } else {
      setCustomerPhone(customerPhone + key)
    }
  }

  const handleDelete = () => {
    if (activeField === "name") {
      setCustomerName(customerName.slice(0, -1))
    } else {
      setCustomerPhone(customerPhone.slice(0, -1))
    }
  }

  const handleSpace = () => {
    if (activeField === "name") {
      setCustomerName(customerName + " ")
    } else {
      setCustomerPhone(customerPhone + " ")
    }
  }

  const handleCreateOrder = async () => {
    if (!customerName || !pickupTime || items.length === 0) return
    
    try {
      setIsSubmitting(true)
      const payload: any = {
        customerName,
        pickupTime,
        items: items.map(p => ({ name: p.name, quantity: p.quantity }))
      }
      const phone = customerPhone.trim()
      if (phone) {
        payload.customerPhone = phone
      }
      await apiCreateOrder(payload)
      
      resetOrder()
      onFinish()
    } catch (error) {
      handleApiError(error, "crear el pedido")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full min-h-0">
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-0">
            {/* Header / Summary */}
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 shrink-0">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-medium mb-1 text-gray-900">Datos del Cliente</h2>
                    <p className="text-muted-foreground text-sm truncate">Ingresa el nombre y teléfono opcional</p>
                </div>
                <div className="w-full sm:w-auto text-right bg-white p-3 rounded-xl border shadow-sm flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 lg:mb-0 mb-4">
                    <div className="flex flex-col items-start sm:items-end">
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total a Pagar</div>
                      <div className="text-3xl font-medium text-gray-900">€{total.toFixed(2)}</div>
                    </div>
                    <div className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md">
                        Recogida: {pickupTime}
                    </div>
                </div>
            </div>

            {/* Inputs Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 shrink-0">
                <div 
                    onClick={() => setActiveField("name")}
                    className={`p-4 lg:p-6 bg-white rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                        activeField === "name" ? "border-red-500 ring-2 ring-red-500/10 shadow-lg scale-[1.005]" : "border-gray-200 shadow-sm hover:border-red-200"
                    }`}
                >
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase mb-2">
                        <User className="w-4 h-4" />
                        Nombre del Cliente
                    </label>
                    <Input
                        type="text"
                        placeholder="Escribe el nombre..."
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        onFocus={() => setActiveField("name")}
                        className="text-2xl lg:text-3xl font-medium h-14 bg-transparent border-0 p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    {activeField === "name" && (
                        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-red-500 animate-pulse" />
                    )}
                </div>
                <div
                    onClick={() => setActiveField("phone")}
                    className={`p-4 lg:p-6 bg-white rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                        activeField === "phone" ? "border-red-500 ring-2 ring-red-500/10 shadow-lg scale-[1.005]" : "border-gray-200 shadow-sm hover:border-red-200"
                    }`}
                >
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase mb-2">
                        Teléfono (opcional)
                    </label>
                    <Input
                        type="tel"
                        inputMode="tel"
                        placeholder="+34 600 000 000"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        onFocus={() => setActiveField("phone")}
                        className="text-lg lg:text-xl h-12 bg-transparent border-0 p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 font-medium"
                    />
                    {activeField === "phone" && (
                        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-red-500 animate-pulse" />
                    )}
                </div>
            </div>
        </div>

        {/* Virtual Keyboard Area */}
        <div className="shrink-0 bg-white rounded-t-3xl lg:rounded-t-4xl shadow-[0_-8px_32px_rgba(0,0,0,0.08)] border-t border-gray-100 flex flex-col overflow-hidden z-10">
            <div className="p-1 lg:p-2 hidden lg:block">
                <VirtualKeyboard 
                    onKeyPress={handleKeyPress}
                    onDelete={handleDelete}
                    onSpace={handleSpace}
                />
            </div>
            
            {/* Actions Footer */}
            <div className="p-4 lg:p-6 bg-gray-50 border-t flex justify-between items-center gap-4">
                <Button 
                    variant="outline" 
                    size="lg" 
                    className="h-14 lg:h-20 px-6 lg:px-10 text-lg lg:text-xl font-medium border-2 hover:bg-white hover:border-gray-300 rounded-xl lg:rounded-2xl flex-1 lg:flex-none"
                    onClick={onBack}
                >
                    <ChevronLeft className="mr-2 w-6 h-6 lg:w-8 lg:h-8" />
                    Atrás
                </Button>

                <Button 
                    size="lg" 
                    className="h-14 lg:h-20 px-8 lg:px-16 text-xl lg:text-2xl font-medium shadow-xl hover:scale-105 transition-transform bg-green-600 hover:bg-green-700 text-white rounded-xl lg:rounded-2xl flex-[2] lg:flex-none"
                    disabled={!customerName || isSubmitting}
                    onClick={handleCreateOrder}
                >
                    {isSubmitting ? (
                        "Creando..."
                    ) : (
                        <>
                            <Check className="mr-2 lg:mr-3 w-6 h-6 lg:w-8 lg:h-8" />
                            Confirmar
                        </>
                    )}
                </Button>
            </div>
        </div>
      </div>
    </div>
  )
}
