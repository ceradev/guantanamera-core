"use client"

import { Card } from "@/components/ui/data-display/card"
import { Button } from "@/components/ui/buttons/button"
import { Switch } from "@/components/ui/buttons/switch"
import { Label } from "@/components/ui/tipography/label"
import {
  Save,
  Store,
  Utensils,
  ShieldCheck,
  Activity,
  AlertTriangle,
  MapPin,
  Phone,
  Clock,
  Loader2
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()
  const {
    ordersEnabled,
    setOrdersEnabled,
    prepTime,
    setPrepTime,
    storeName,
    setStoreName,
    storeAddress,
    setStoreAddress,
    storePhone,
    setStorePhone,
    weeklySchedule,
    setWeeklySchedule,
    isLoading,
    saveSuccess,
    isRegeneratingKey,
    handleSave,
    handleRegenerateKey,
  } = useSettings()

  const SectionHeader = ({ icon: Icon, title, description }: { icon: any, title: string, description?: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 border-b pb-4">
      <div className="p-2.5 bg-gray-100 rounded-xl w-fit">
        <Icon className="w-6 h-6 text-gray-700" />
      </div>
      <div>
        <h2 className="text-xl md:text-2xl font-medium text-gray-900 tracking-tight">{title}</h2>
        {description && <p className="text-sm md:text-base text-gray-500 font-medium">{description}</p>}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
          <p className="text-gray-500 font-medium">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      {/* Header */}
      <header className="bg-white border-b px-4 md:px-8 py-6 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-medium text-gray-900 flex items-center gap-3 truncate tracking-tight">
            Configuración
          </h1>
          <p className="text-muted-foreground mt-1 text-base md:text-lg font-medium truncate">Gestiona las preferencias del negocio</p>
        </div>
        <motion.div whileTap={{ scale: 0.97 }} className="shrink-0">
          <Button
            onClick={handleSave}
            size="lg"
            className="w-full sm:w-auto h-12 px-8 text-lg font-medium shadow-md hover:shadow-lg bg-red-600 hover:bg-red-700 rounded-xl transition-all"
          >
            <Save className="w-5 h-5 mr-2" />
            Guardar Cambios
          </Button>
        </motion.div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-20">

          {/* Success Notification */}
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 flex items-center gap-4 shadow-lg sticky top-4 z-20"
            >
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                <Save className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-medium text-green-900 text-lg">Configuración guardada</p>
                <p className="text-sm md:text-base text-green-700 font-medium">Los cambios se han aplicado correctamente</p>
              </div>
            </motion.div>
          )}

          {/* Section 1: Business Info */}
          <Card className="p-5 md:p-8 shadow-sm border-2 border-gray-100 rounded-2xl overflow-hidden">
            <SectionHeader
              icon={Store}
              title="Información del Negocio"
              description="Datos públicos y horarios del establecimiento"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-base font-medium text-gray-700 ml-1 flex items-center gap-2">
                    <Store className="w-4 h-4" /> Nombre del Establecimiento
                  </Label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full h-12 px-4 border-2 border-gray-100 rounded-xl text-gray-900 font-medium focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all"
                    placeholder="Ej. Guantanamera"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium text-gray-700 ml-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Dirección
                  </Label>
                  <input
                    type="text"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    className="w-full h-12 px-4 border-2 border-gray-100 rounded-xl text-gray-900 font-medium focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all"
                    placeholder="Ej. Calle Mayor 10, Madrid"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium text-gray-700 ml-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Teléfono de Contacto
                  </Label>
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className="w-full h-12 px-4 border-2 border-gray-100 rounded-xl text-gray-900 font-medium focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all"
                    placeholder="Ej. +34 912 345 678"
                  />
                </div>
              </div>
            </div>
          </Card>
          
          {/* Section 1.5: Weekly Schedule */}
          <Card className="p-5 md:p-8 shadow-sm border-2 border-gray-100 rounded-2xl overflow-hidden">
            <SectionHeader
              icon={Clock}
              title="Horario Semanal"
              description="Configura los días de apertura y sus horarios específicos"
            />

            <div className="space-y-4">
              {weeklySchedule.map((day, index) => (
                <div key={day.day} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-2xl border-2 border-gray-100">
                  <div className="w-full sm:w-40 flex items-center gap-4 shrink-0">
                    <Switch
                      checked={day.enabled}
                      onCheckedChange={(checked) => {
                        const newSchedule = [...weeklySchedule]
                        newSchedule[index].enabled = checked
                        setWeeklySchedule(newSchedule)
                      }}
                    />
                    <span className={cn("font-medium text-lg min-w-[100px]", !day.enabled && "text-gray-400")}>{day.name}</span>
                  </div>
                  
                  <div className="flex-1 w-full grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-400 uppercase font-medium tracking-widest ml-1">Apertura</Label>
                      <select
                        disabled={!day.enabled}
                        value={day.open}
                        onChange={(e) => {
                          const newSchedule = [...weeklySchedule]
                          newSchedule[index].open = e.target.value
                          setWeeklySchedule(newSchedule)
                        }}
                        className="w-full h-11 px-3 border-2 border-white rounded-xl bg-white text-base font-medium shadow-sm focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all cursor-pointer disabled:opacity-50"
                      >
                        {Array.from({ length: 24 }).map((_, i) => {
                          const hour = `${i.toString().padStart(2, '0')}:00`
                          return <option key={hour} value={hour}>{hour}</option>
                        })}
                        {Array.from({ length: 24 }).map((_, i) => {
                          const hour = `${i.toString().padStart(2, '0')}:30`
                          return <option key={hour} value={hour}>{hour}</option>
                        })}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-400 uppercase font-medium tracking-widest ml-1">Cierre</Label>
                      <select
                        disabled={!day.enabled}
                        value={day.close}
                        onChange={(e) => {
                          const newSchedule = [...weeklySchedule]
                          newSchedule[index].close = e.target.value
                          setWeeklySchedule(newSchedule)
                        }}
                        className="w-full h-11 px-3 border-2 border-white rounded-xl bg-white text-base font-medium shadow-sm focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all cursor-pointer disabled:opacity-50"
                      >
                        {Array.from({ length: 24 }).map((_, i) => {
                          const hour = `${i.toString().padStart(2, '0')}:00`
                          return <option key={hour} value={hour}>{hour}</option>
                        })}
                        {Array.from({ length: 24 }).map((_, i) => {
                          const hour = `${i.toString().padStart(2, '0')}:30`
                          return <option key={hour} value={hour}>{hour}</option>
                        })}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Section 2: Order Settings */}
          <Card className="p-5 md:p-8 shadow-sm border-2 border-gray-100 rounded-2xl">
            <SectionHeader
              icon={Utensils}
              title="Gestión de Pedidos"
              description="Control de disponibilidad y tiempos de servicio"
            />

            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-gray-50 rounded-2xl border-2 border-gray-100 gap-6">
                <div className="space-y-1">
                  <Label className="text-xl font-medium text-gray-900 tracking-tight">Estado del Servicio</Label>
                  <p className="text-sm md:text-base text-gray-500 font-medium">
                    {ordersEnabled
                      ? "El sistema está aceptando nuevos pedidos normalmente"
                      : "La recepción de pedidos está DESACTIVADA manualmente"}
                  </p>
                </div>
                <Switch
                  checked={ordersEnabled}
                  onCheckedChange={setOrdersEnabled}
                  className="scale-150 data-[state=checked]:bg-green-600 transition-all"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium text-gray-700 ml-1">Tiempo de Preparación Estándar</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[15, 30, 45, 60].map((time) => (
                    <button
                      key={time}
                      onClick={() => setPrepTime(time)}
                      className={cn(
                        "h-14 px-4 rounded-xl border-2 font-medium text-lg transition-all shadow-sm flex items-center justify-center",
                        prepTime === time
                          ? "border-red-600 bg-red-50 text-red-700 shadow-red-100 ring-4 ring-red-500/10"
                          : "border-gray-100 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      {time} min
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground ml-1">
                  Este tiempo se utilizará para calcular la hora estimada de recogida de nuevos pedidos.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 4: Security */}
          <Card className="p-5 md:p-8 shadow-sm border-2 border-red-100 bg-red-50/20 rounded-2xl">
            <SectionHeader
              icon={ShieldCheck}
              title="Seguridad y Acceso"
              description="Gestión de credenciales críticas"
            />

            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base font-medium text-gray-900 ml-1">API Key del Establecimiento</Label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 h-12 bg-white border-2 border-gray-100 rounded-xl flex items-center px-4 font-mono text-gray-400 select-none text-sm overflow-hidden shadow-inner">
                    sk_live_••••••••••••••••••••••••
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleRegenerateKey}
                    className="h-12 px-8 border-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300 font-medium rounded-xl transition-all"
                  >
                    {isRegeneratingKey ? "Regenerando..." : "Regenerar"}
                  </Button>
                </div>
                <div className="bg-red-100/50 p-4 rounded-2xl border-2 border-red-100 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium leading-relaxed">
                    ADVERTENCIA: Regenerar la clave desconectará inmediatamente todos los dispositivos vinculados (TPVs, Cocina, Tablets).
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 5: System Status */}
          <Card className="p-5 md:p-8 shadow-sm bg-white border-2 border-gray-100 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 border-b pb-4">
              <div className="p-2.5 bg-gray-50 rounded-xl w-fit">
                <Activity className="w-5 h-5 text-gray-400" />
              </div>
              <h2 className="text-lg md:text-xl font-medium text-gray-900 tracking-tight">Estado del Sistema</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-5 rounded-2xl border-2 border-gray-100 shadow-sm transition-all hover:border-gray-200">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mb-2">Backend API</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.3)]" />
                  <span className="font-medium text-lg text-gray-900 tracking-tight">ONLINE</span>
                </div>
              </div>
              <div className="bg-gray-50 p-5 rounded-2xl border-2 border-gray-100 shadow-sm transition-all hover:border-gray-200">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mb-2">Base de Datos</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.3)]" />
                  <span className="font-medium text-lg text-gray-900 tracking-tight">CONECTADO</span>
                </div>
              </div>
              <div className="bg-gray-50 p-5 rounded-2xl border-2 border-gray-100 shadow-sm transition-all hover:border-gray-200">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mb-2">Versión Software</p>
                <span className="font-medium text-lg text-gray-900 tracking-tight">v1.2.0-stable</span>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}
