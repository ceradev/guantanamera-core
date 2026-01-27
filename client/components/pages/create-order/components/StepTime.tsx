"use client"

import React from "react"
import { useOrderDraft } from "@/context/OrderDraftContext"
import { Button } from "@/components/ui/buttons/button"
import { TimeSlotSelector } from "@/components/pages/create-order/components/TimeSlotSelector"
import { Input } from "@/components/ui/inputs/input"
import { ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react"
import { useSettings } from "@/hooks/use-settings"
import { getStoreCurrentTimeMinutes } from "@/utils/timeSlots"

interface StepTimeProps {
  onNext: () => void
  onBack: () => void
}

export function StepTime({ onNext, onBack }: StepTimeProps) {
  const { pickupTime, setPickupTime, total } = useOrderDraft()
  const { prepTime, isLoading, weeklySchedule } = useSettings()
  const [customTime, setCustomTime] = React.useState(pickupTime || "")
  const [error, setError] = React.useState("")

  const { openingTime, closingTime } = React.useMemo(() => {
    const defaultHours = { openingTime: "", closingTime: "" }
    if (!weeklySchedule || weeklySchedule.length === 0) {
      return defaultHours
    }
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
    const todaySchedule = weeklySchedule.find((s: any) => s.day === currentDay)
    
    if (todaySchedule && todaySchedule.enabled) {
      return { openingTime: todaySchedule.open, closingTime: todaySchedule.close }
    }
    return defaultHours
  }, [weeklySchedule])

  const validateAndSetTime = (value: string) => {
    setCustomTime(value)
    setError("")
    if (!value) {
      setPickupTime("") // Allow clearing the time
      return
    }
    const parts = value.split(":")
    if (parts.length !== 2) {
      setError("Formato HH:MM")
      return
    }
    const h = Number(parts[0])
    const m = Number(parts[1])
    if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      setError("Hora inválida")
      return
    }
    
    const currentTotalMinutes = getStoreCurrentTimeMinutes()
    const candidateTotalMinutes = h * 60 + m
    
    // Validate against opening hours
    if (!openingTime || !closingTime) {
      setError("Establecimiento cerrado hoy")
      setPickupTime("")
      return
    }

    const [openH, openM] = openingTime.split(":").map(Number)
    const [closeH, closeM] = closingTime.split(":").map(Number)
    const openTotal = openH * 60 + openM
    const closeTotal = closeH * 60 + closeM
    
    const isWithinRange = (timeMinutes: number) => {
      if (closeTotal < openTotal) {
        // Overlaps midnight
        return timeMinutes >= openTotal || timeMinutes <= closeTotal;
      }
      return timeMinutes >= openTotal && timeMinutes <= closeTotal;
    };
    
    if (!isWithinRange(candidateTotalMinutes)) {
      setError(`Fuera de horario (${openingTime} - ${closingTime})`)
      setPickupTime("")
      return
    }

    let adjustedCandidate = candidateTotalMinutes;
    if (closeTotal < openTotal && candidateTotalMinutes < openTotal && currentTotalMinutes >= openTotal) {
      adjustedCandidate += 1440;
    }

    if (adjustedCandidate < currentTotalMinutes + prepTime) {
      setError(`Mínimo ${prepTime} min. de preparación`)
      setPickupTime("")
      return
    }
    setPickupTime(value)
  }

  const handleSelectTimeSlot = (time: string) => {
    setPickupTime(time)
    setCustomTime(time)
    setError("")
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      <div className="flex-1 flex flex-col w-full p-4 md:p-6 h-full">
        {/* Header Section */}
        <div className="mb-4 text-center shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">¿A qué hora se recoge?</h2>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border p-4 md:p-6 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
          {/* Left Column: Time Slot Selector */}
          <div className="flex-1 min-h-0 lg:border-r lg:pr-6">
            <p className="text-muted-foreground text-center mb-4">Selecciona un horario disponible</p>
            <TimeSlotSelector 
                selectedTime={pickupTime}
                onSelect={handleSelectTimeSlot}
                openingTime={openingTime}
                closingTime={closingTime}
                prepTime={prepTime}
            />
          </div>

          {/* Right Column: Custom Time & Summary */}
          <div className="flex flex-col gap-6 lg:w-72 shrink-0">
            {/* Custom Time */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-bold text-gray-500 uppercase">O introduce una hora</span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={customTime}
                  onChange={(e) => validateAndSetTime(e.target.value)}
                  className="h-11 text-base"
                />
              </div>
              {error && (
                <div className="mt-2 text-sm font-semibold text-red-600">{error}</div>
              )}
            </div>

            {/* Selection Feedback */}
            {pickupTime && !error && (
              <div className="mt-auto text-center animate-in fade-in slide-in-from-bottom-4 p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-base text-gray-600">
                  Recogida a las
                </p>
                <p className="text-green-700 font-black text-4xl">{pickupTime}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="mt-4 md:mt-6 flex items-center justify-between shrink-0 gap-4">
          <Button 
            variant="outline" 
            size="lg" 
            className="h-14 lg:h-16 px-6 lg:px-8 text-base lg:text-lg font-medium rounded-xl lg:rounded-lg flex-1 lg:flex-none"
            onClick={onBack}
          >
            <ChevronLeft className="mr-1 lg:mr-2 w-5 h-5 lg:w-6 lg:h-6" />
            Atrás
          </Button>

          <div className="text-right shrink-0">
             <div className="text-[10px] lg:text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</div>
             <div className="text-xl lg:text-2xl font-black text-gray-900">€{total.toFixed(2)}</div>
          </div>

          <Button 
            size="lg" 
            className="h-14 lg:h-16 px-6 lg:px-10 text-lg lg:text-xl font-bold shadow-lg rounded-xl lg:rounded-lg bg-red-600 hover:bg-red-700 flex-[2] lg:flex-none"
            disabled={!pickupTime || !!error}
            onClick={onNext}
          >
            Continuar
            <ChevronRight className="ml-1 lg:ml-2 w-5 h-5 lg:w-6 lg:h-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}
