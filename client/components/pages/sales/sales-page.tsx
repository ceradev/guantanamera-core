"use client"

import { useState } from "react"

import { Card } from "@/components/ui/data-display/card"
import { Badge } from "@/components/ui/data-display/badge"
import { Euro, Package, CalendarRange } from "lucide-react"
import { ErrorState } from "@/components/states/ErrorState"
import Skeleton from "react-loading-skeleton"
import { Button } from "@/components/ui/buttons/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/overlays/popover"
import { Calendar } from "@/components/ui/inputs/calendar"
import { es } from "date-fns/locale"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/data-display/chart"
import { BarChart, Bar, XAxis, YAxis } from "recharts"
import { useSalesDashboard } from "@/hooks/use-sales-dashboard"
import { ManualSaleModal } from "./components/manual-sale-modal"

export default function SalesPage() {
  const {
    data,
    loading,
    error,
    type,
    setType,
    date,
    setDate,
    selectedCategoryId,
    setSelectedCategoryId,
    parseDate,
    fmtISO,
    startOfWeekMonday,
    addDays,
    onCalendarSelect,
    fetchSales,
    periodLabel,
    deltaSales,
    deltaOrders,
    deltaAOV,
    categoriesData,
    chartConfig,
    exportCSV,
    source,
    setSource,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
  } = useSalesDashboard()

  // State for custom date range picker
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
  const [tempFromDate, setTempFromDate] = useState<string>('')
  const [tempToDate, setTempToDate] = useState<string>('')

  // Sync temp dates when popover opens or type changes to custom
  const handlePopoverOpen = (open: boolean) => {
    setIsDatePopoverOpen(open)
    if (open && type === 'custom') {
      setTempFromDate(fromDate || '')
      setTempToDate(toDate || '')
    }
  }

  // Confirm custom date selection
  const handleConfirmCustomDates = () => {
    if (tempFromDate && tempToDate) {
      setFromDate(tempFromDate)
      setToDate(tempToDate)
      setIsDatePopoverOpen(false)
    }
  }

  return (
    <div className="relative h-full min-h-0 flex flex-col bg-white">
      {loading ? (
        <div className="flex-1 flex flex-col h-full">
          <header className="bg-white border-b px-4 md:px-8 py-6 shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-12">
                <div>
                  <Skeleton width={220} height={36} />
                  <Skeleton width={180} height={20} className="mt-2" />
                </div>
                <div className="flex items-center gap-1 bg-gray-50 border rounded-xl p-1 w-fit">
                  <Skeleton width={200} height={40} />
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <Skeleton width={150} height={48} className="rounded-xl" />
                <Skeleton width={120} height={48} className="rounded-xl" />
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4 md:p-8 space-y-4">
                  <Skeleton width={120} height={18} />
                  <Skeleton width={180} height={40} />
                </Card>
              ))}
            </section>
          </main>
        </div>
      ) : error ? (
        <main className="flex-1 p-4 md:p-8">
          <ErrorState
            title="No se pueden obtener las ventas"
            description="Intenta de nuevo en unos segundos."
            onRetry={fetchSales}
          />
        </main>
      ) : data ? (
        <div className="flex-1 flex flex-col h-full">
          <header className="bg-white border-b px-4 md:px-8 py-6 shrink-0">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-8">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">Ventas</h1>
                  <p className="text-muted-foreground mt-1 text-xs md:text-sm">Periodo: {periodLabel}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1 bg-gray-50 border rounded-xl p-1 w-fit">
                    <button
                      className={`px-3 md:px-5 py-2 rounded-lg text-sm transition-all ${type === "day" ? "bg-white border shadow-sm font-bold text-red-600" : "text-gray-500 hover:text-gray-700 font-medium"}`}
                      onClick={() => setType("day")}
                    >
                      Día
                    </button>
                    <button
                      className={`px-3 md:px-5 py-2 rounded-lg text-sm transition-all ${type === "week" ? "bg-white border shadow-sm font-bold text-red-600" : "text-gray-500 hover:text-gray-700 font-medium"}`}
                      onClick={() => setType("week")}
                    >
                      Semana
                    </button>
                    <button
                      className={`px-3 md:px-5 py-2 rounded-lg text-sm transition-all ${type === "month" ? "bg-white border shadow-sm font-bold text-red-600" : "text-gray-500 hover:text-gray-700 font-medium"}`}
                      onClick={() => setType("month")}
                    >
                      Mes
                    </button>
                    <button
                      className={`px-3 md:px-5 py-2 rounded-lg text-sm transition-all ${type === "custom" ? "bg-white border shadow-sm font-bold text-red-600" : "text-gray-500 hover:text-gray-700 font-medium"}`}
                      onClick={() => setType("custom")}
                    >
                      Personalizado
                    </button>
                  </div>

                  <div className="flex items-center gap-1 bg-gray-50 border rounded-xl p-1 w-fit">
                    <button
                      className={`px-3 md:px-5 py-2 rounded-lg text-sm transition-all ${!source ? "bg-white border shadow-sm font-bold text-gray-900" : "text-gray-500 hover:text-gray-700 font-medium"}`}
                      onClick={() => setSource("")}
                    >
                      Todo
                    </button>
                    <button
                      className={`px-3 md:px-5 py-2 rounded-lg text-sm transition-all ${source === "ORDER" ? "bg-white border shadow-sm font-bold text-gray-900" : "text-gray-500 hover:text-gray-700 font-medium"}`}
                      onClick={() => setSource("ORDER")}
                    >
                      Pedidos
                    </button>
                    <button
                      className={`px-3 md:px-5 py-2 rounded-lg text-sm transition-all ${source === "MANUAL" ? "bg-white border shadow-sm font-bold text-gray-900" : "text-gray-500 hover:text-gray-700 font-medium"}`}
                      onClick={() => setSource("MANUAL")}
                    >
                      Manual
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <Popover open={isDatePopoverOpen} onOpenChange={handlePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 md:h-10 flex-1 sm:flex-none flex items-center gap-2 px-3 md:px-4 rounded-xl border-2 font-medium text-xs md:text-sm">
                      <CalendarRange className="w-4 h-4 text-gray-500" />
                      <span className="whitespace-nowrap">{periodLabel || date}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[calc(100vw-2rem)] sm:w-fit p-2" align="end">
                    <div className="text-sm font-bold mb-3 px-2">
                      {type === "day" ? "Selecciona día" : type === "week" ? "Selecciona semana" : type === "month" ? "Selecciona mes" : "Selecciona rango personalizado"}
                    </div>
                    {type === "custom" ? (
                      <div className="flex flex-col">
                        <Calendar
                          locale={es}
                          weekStartsOn={1 as any}
                          mode="range"
                          className="p-0"
                          selected={
                            tempFromDate && tempToDate
                              ? { from: new Date(tempFromDate), to: new Date(tempToDate) }
                              : tempFromDate
                                ? { from: new Date(tempFromDate), to: undefined }
                                : undefined
                          }
                          onSelect={(range) => {
                            if (range?.from) {
                              setTempFromDate(fmtISO(range.from))
                            }
                            if (range?.to) {
                              setTempToDate(fmtISO(range.to))
                            } else if (range?.from && !range?.to) {
                              setTempToDate('')
                            }
                          }}
                          numberOfMonths={2}
                          captionLayout="dropdown"
                        />
                        <div className="flex items-center justify-between mt-3 px-1">
                          {tempFromDate && !tempToDate ? (
                            <p className="text-xs text-muted-foreground">
                              Selecciona la fecha de fin
                            </p>
                          ) : tempFromDate && tempToDate ? (
                            <p className="text-sm text-gray-600">
                              {new Date(tempFromDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                              {' – '}
                              {new Date(tempToDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Selecciona las fechas
                            </p>
                          )}
                          <Button
                            size="sm"
                            disabled={!tempFromDate || !tempToDate}
                            onClick={handleConfirmCustomDates}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
                          >
                            Confirmar
                          </Button>
                        </div>
                      </div>
                    ) : type === "month" ? (
                      <div className="grid grid-cols-2 gap-2 p-1">
                        <select
                          className="border-2 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                          value={parseDate(date).getMonth()}
                          onChange={(e) => {
                            const m = Number(e.target.value)
                            const y = parseDate(date).getFullYear()
                            setDate(fmtISO(new Date(y, m, 1)))
                          }}
                        >
                          {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((name, idx) => (
                            <option key={name} value={idx}>{name}</option>
                          ))}
                        </select>
                        <select
                          className="border-2 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                          value={parseDate(date).getFullYear()}
                          onChange={(e) => {
                            const y = Number(e.target.value)
                            const m = parseDate(date).getMonth()
                            setDate(fmtISO(new Date(y, m, 1)))
                          }}
                        >
                          {Array.from({ length: 8 }).map((_, i) => {
                            const baseYear = new Date().getFullYear()
                            const y = baseYear - 4 + i
                            return <option key={y} value={y}>{y}</option>
                          })}
                        </select>
                      </div>
                    ) : (
                      <div className="p-1 overflow-x-auto max-w-full">
                        {type === "week" ? (
                          <Calendar
                            locale={es}
                            weekStartsOn={1 as any}
                            mode="range"
                            required
                            className="w-full p-0 flex justify-center"
                            selected={{
                              from: startOfWeekMonday(parseDate(date)),
                              to: addDays(startOfWeekMonday(parseDate(date)), 6),
                            }}
                            onSelect={(val) => {
                              const base = val?.from ? startOfWeekMonday(val.from) : startOfWeekMonday(parseDate(date))
                              setDate(fmtISO(base))
                            }}
                            captionLayout="dropdown"
                            showWeekNumber={false}
                          />
                        ) : (
                          <Calendar
                            locale={es}
                            weekStartsOn={1 as any}
                            mode="single"
                            className="w-full p-0 flex justify-center"
                            selected={parseDate(date)}
                            onSelect={(val) => {
                              if (val) onCalendarSelect(val)
                            }}
                            captionLayout="dropdown"
                            showWeekNumber={false}
                          />
                        )}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
                <Button
                  variant="outline"
                  onClick={exportCSV}
                  className="h-10 flex-1 sm:flex-none px-4 rounded-xl border-2 font-bold hover:bg-gray-50"
                >
                  Exportar
                </Button>
                <ManualSaleModal onSuccess={fetchSales} />
              </div>
            </div>
          </header>

          <main className="flex-1 p-3 md:p-6 overflow-y-auto min-h-0 bg-gray-50/30">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <Card className="p-4 md:p-6 shadow-sm border-2 border-gray-100 rounded-2xl">
                  <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Total vendido</p>
                  <div className="mt-2 flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-red-50 rounded-lg">
                      <Euro className="w-4 h-4 md:w-6 md:h-6 text-red-600" />
                    </div>
                    <span className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">
                      €{data.totalSales.toFixed(2)}
                    </span>
                  </div>
                  {deltaSales !== null && (
                    <Badge className={`mt-2 md:mt-3 text-[10px] font-bold px-1.5 py-0.5 ${deltaSales >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {deltaSales >= 0 ? "+" : ""}{deltaSales.toFixed(1)}%
                    </Badge>
                  )}
                </Card>

                <Card className="p-4 md:p-6 shadow-sm border-2 border-gray-100 rounded-2xl">
                  <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Nº de pedidos</p>
                  <div className="mt-2 flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-gray-50 rounded-lg">
                      <Package className="w-4 h-4 md:w-6 md:h-6 text-gray-700" />
                    </div>
                    <span className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">
                      {data.totalOrders}
                    </span>
                  </div>
                  {deltaOrders !== null && (
                    <Badge className={`mt-2 md:mt-3 text-[10px] font-bold px-1.5 py-0.5 ${deltaOrders >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {deltaOrders >= 0 ? "+" : ""}{deltaOrders.toFixed(1)}%
                    </Badge>
                  )}
                </Card>

                <Card className="p-4 md:p-6 shadow-sm border-2 border-gray-100 rounded-2xl">
                  <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket medio</p>
                  <div className="mt-2 flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-gray-50 rounded-lg">
                      <Euro className="w-4 h-4 md:w-6 md:h-6 text-gray-700" />
                    </div>
                    <span className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">
                      €{data.averageOrderValue.toFixed(2)}
                    </span>
                  </div>
                  {deltaAOV !== null && (
                    <Badge className={`mt-2 md:mt-3 text-[10px] font-bold px-1.5 py-0.5 ${deltaAOV >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {deltaAOV >= 0 ? "+" : ""}{deltaAOV.toFixed(1)}%
                    </Badge>
                  )}
                </Card>

                <Card className="p-4 md:p-6 shadow-sm border-2 border-gray-100 rounded-2xl">
                  <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Tasa de conversión</p>
                  <div className="mt-2 flex items-center gap-2 md:gap-3">
                    <span className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">
                      {typeof data.conversionRate === "number" ? `${(data.conversionRate * 100).toFixed(1)}%` : "—"}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 font-medium">Frecuencia: {typeof data.purchaseFrequencyPerDay === "number" ? data.purchaseFrequencyPerDay.toFixed(2) : "—"}/día</p>
                </Card>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <Card className="p-4 md:p-6 shadow-sm border-2 border-gray-100 rounded-2xl">
                  <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Producto más vendido (unidades)</p>
                  <div className="mt-2 md:mt-4">
                    <div className="text-base md:text-lg font-bold text-gray-900">{data.topProductByUnits?.name || "—"}</div>
                    <div className="text-red-600 font-bold mt-0.5 md:mt-1 text-xs md:text-sm">{data.topProductByUnits ? `${data.topProductByUnits.quantity} unidades` : ""}</div>
                  </div>
                </Card>
                <Card className="p-4 md:p-6 shadow-sm border-2 border-gray-100 rounded-2xl">
                  <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Producto más vendido (ingresos)</p>
                  <div className="mt-2 md:mt-4">
                    <div className="text-base md:text-lg font-bold text-gray-900">{data.topProductByRevenue?.name || "—"}</div>
                    <div className="text-red-600 font-bold mt-0.5 md:mt-1 text-xs md:text-sm">{data.topProductByRevenue ? `€${data.topProductByRevenue.revenue.toFixed(2)}` : ""}</div>
                  </div>
                </Card>
              </section>

              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                  <div>
                    <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider">Segmentación por categorías</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 font-medium">Visualiza el rendimiento por tipo de producto</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white border-2 rounded-2xl p-1.5 shadow-sm w-full sm:w-auto">
                    <span className="text-xs font-bold text-gray-400 uppercase ml-2 hidden sm:inline">Categoría:</span>
                    <select
                      value={selectedCategoryId === "all" ? "" : selectedCategoryId}
                      onChange={(e) => {
                        const v = e.target.value
                        setSelectedCategoryId(v === "" ? "all" : Number(v))
                      }}
                      className="flex-1 sm:flex-none border-none bg-transparent px-2 py-1 text-sm font-bold text-gray-900 focus:ring-0 outline-none cursor-pointer h-9 min-w-[160px]"
                    >
                      <option value="">Todas las categorías</option>
                      {(data.categories || []).map((c) => (
                        <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Card className="p-4 md:p-6 shadow-sm border-2 border-gray-100 rounded-2xl overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <div className="min-w-[600px] lg:min-w-0">
                      <ChartContainer config={chartConfig} className="h-[350px] md:h-96">
                        <BarChart data={categoriesData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                          <XAxis
                            dataKey="name"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#6b7280', fontWeight: 600 }}
                            dy={10}
                          />
                          <YAxis
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#6b7280', fontWeight: 600 }}
                            tickFormatter={(value) => `€${value}`}
                          />
                          <ChartTooltip content={<ChartTooltipContent className="bg-white border-2 shadow-xl rounded-xl" />} />
                          <Bar
                            dataKey="revenue"
                            fill="var(--color-revenue)"
                            radius={[6, 6, 0, 0]}
                            barSize={32}
                            name="Ingresos (€)"
                          />
                          <Bar
                            dataKey="units"
                            fill="var(--color-units)"
                            radius={[6, 6, 0, 0]}
                            barSize={32}
                            name="Unidades"
                          />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  </div>
                </Card>
              </section>

              {data.products && data.products.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div>
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Detalle por Producto</p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium">Listado detallado de productos vendidos</p>
                    </div>
                  </div>
                  <Card className="shadow-sm border-2 border-gray-100 rounded-2xl overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                          <tr>
                            <th className="px-6 py-3 font-bold">Producto</th>
                            <th className="px-6 py-3 font-bold text-right">Cantidad</th>
                            <th className="px-6 py-3 font-bold text-right">Ingresos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.products.map((p) => (
                            <tr key={p.productId} className="border-b last:border-0 hover:bg-gray-50/50">
                              <td className="px-4 py-3 md:px-6 md:py-4 font-medium text-gray-900">{p.name}</td>
                              <td className="px-4 py-3 md:px-6 md:py-4 text-right">{p.quantity}</td>
                              <td className="px-4 py-3 md:px-6 md:py-4 text-right font-bold">€{p.revenue.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </section>
              )}
            </div>
          </main>
        </div>
      ) : (
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center bg-gray-50/30">
          <Card className="p-10 text-center shadow-xl border-2 border-gray-100 rounded-3xl max-w-md w-full">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CalendarRange className="w-10 h-10 text-gray-300" />
            </div>
            <div className="text-2xl font-bold mb-2 text-gray-900">Sin datos disponibles</div>
            <div className="text-muted-foreground font-medium">No hay registros para el periodo seleccionado. Intenta ajustar el filtro de fecha.</div>
            <Button
              className="mt-8 w-full h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700"
              onClick={() => setType("day")}
            >
              Ver hoy
            </Button>
          </Card>
        </main>
      )}
    </div>
  )
}
