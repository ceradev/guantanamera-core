"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/data-display/card"
import { Badge } from "@/components/ui/data-display/badge"
import { Button } from "@/components/ui/buttons/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/overlays/popover"
import { Calendar } from "@/components/ui/inputs/calendar"
import { ErrorState } from "@/components/states/ErrorState"
import Skeleton from "react-loading-skeleton"
import {
    Euro,
    CalendarRange,
    Plus,
    Trash2,
    FileText,
} from "lucide-react"
import { es } from "date-fns/locale"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { getInvoices, deleteInvoice as deleteInvoiceApi } from "@/services"
import type { Invoice, ExpenseCategory, InvoicesResponse } from "@/types"
import { EXPENSE_CATEGORY_LABELS } from "@/types"
import { AddInvoiceModal } from "./components/add-invoice-modal"

export default function ExpensesPage() {
    // Client-side hydration state
    const [isClient, setIsClient] = useState(false)

    // Date range state - initialized empty, set on client
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")
    const [tempFromDate, setTempFromDate] = useState("")
    const [tempToDate, setTempToDate] = useState("")
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)

    // Category filter state
    const [category, setCategory] = useState<ExpenseCategory | "">("")

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    // Data state
    const [data, setData] = useState<InvoicesResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    // Format date to ISO string
    const fmtISO = (d: Date) => format(d, "yyyy-MM-dd")

    // Initialize dates on client only to avoid hydration mismatch
    useEffect(() => {
        setFromDate(format(startOfMonth(new Date()), "yyyy-MM-dd"))
        setToDate(format(endOfMonth(new Date()), "yyyy-MM-dd"))
        setIsClient(true)
    }, [])

    // Fetch invoices
    const fetchData = useCallback(async () => {
        if (!fromDate || !toDate) return // Wait for dates to be initialized

        setIsLoading(true)
        setError(null)
        try {
            const response = await getInvoices({
                from: fromDate,
                to: toDate,
                category: category || undefined,
            })
            setData(response)
        } catch (e) {
            setError(e as Error)
        } finally {
            setIsLoading(false)
        }
    }, [fromDate, toDate, category])

    useEffect(() => {
        if (isClient) {
            fetchData()
        }
    }, [fetchData, isClient])

    const handleDeleteInvoice = useCallback(async (id: string) => {
        if (confirm("¿Estás seguro de eliminar esta factura?")) {
            try {
                await deleteInvoiceApi(id)
                fetchData()
            } catch (e) {
                console.error("Error deleting invoice:", e)
            }
        }
    }, [fetchData])

    // Date popover handlers
    const handlePopoverOpen = (open: boolean) => {
        setIsDatePopoverOpen(open)
        if (open) {
            setTempFromDate(fromDate)
            setTempToDate(toDate)
        }
    }

    const handleConfirmCustomDates = () => {
        if (tempFromDate && tempToDate) {
            setFromDate(tempFromDate)
            setToDate(tempToDate)
            setIsDatePopoverOpen(false)
        }
    }

    // Modal success handler
    const handleModalSuccess = () => {
        setIsAddModalOpen(false)
        fetchData()
    }

    // Period label - only calculate when dates are available
    const periodLabel = fromDate && toDate
        ? `${format(new Date(fromDate), "d MMM", { locale: es })} - ${format(new Date(toDate), "d MMM yyyy", { locale: es })}`
        : "Cargando..."

    // Format category badge color
    const getCategoryColor = (cat: ExpenseCategory) => {
        const colors: Record<ExpenseCategory, string> = {
            FOOD: "bg-orange-100 text-orange-700",
            DRINKS: "bg-blue-100 text-blue-700",
            SUPPLIES: "bg-purple-100 text-purple-700",
            RENT: "bg-gray-100 text-gray-700",
            UTILITIES: "bg-yellow-100 text-yellow-700",
            MAINTENANCE: "bg-green-100 text-green-700",
            OTHER: "bg-gray-100 text-gray-600",
        }
        return colors[cat] || "bg-gray-100 text-gray-600"
    }

    return (
        <div className="relative h-full min-h-0 flex flex-col bg-white">
            {isLoading ? (
                <div className="flex-1 flex flex-col h-full">
                    <header className="bg-white border-b px-4 md:px-8 py-6 shrink-0">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-12">
                                <div>
                                    <Skeleton width={220} height={36} />
                                    <Skeleton width={180} height={20} className="mt-2" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-4">
                                <Skeleton width={150} height={48} className="rounded-xl" />
                                <Skeleton width={120} height={48} className="rounded-xl" />
                            </div>
                        </div>
                    </header>
                    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                        <Card className="p-4 md:p-8 space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} height={48} />
                            ))}
                        </Card>
                    </main>
                </div>
            ) : error ? (
                <main className="flex-1 p-4 md:p-8">
                    <ErrorState
                        title="No se pueden obtener los gastos"
                        description="Intenta de nuevo en unos segundos."
                        onRetry={() => fetchData()}
                    />
                </main>
            ) : (
                <div className="flex-1 flex flex-col h-full">
                    <header className="bg-white border-b px-4 md:px-8 py-6 shrink-0">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-8">
                                <div>
                                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gastos / Facturas</h1>
                                    <p className="text-muted-foreground mt-1 text-xs md:text-sm">Periodo: {periodLabel}</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-4">
                                    {/* Category filter */}
                                    <div className="flex items-center gap-1 bg-gray-50 border rounded-xl p-1 w-fit overflow-x-auto">
                                        <button
                                            className={`px-3 md:px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${!category ? "bg-white border shadow-sm font-bold text-gray-900" : "text-gray-500 hover:text-gray-700 font-medium"}`}
                                            onClick={() => setCategory("")}
                                        >
                                            Todos
                                        </button>
                                        {(["FOOD", "DRINKS", "SUPPLIES", "RENT", "UTILITIES", "MAINTENANCE", "OTHER"] as ExpenseCategory[]).map((cat) => (
                                            <button
                                                key={cat}
                                                className={`px-3 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${category === cat ? "bg-white border shadow-sm font-bold text-gray-900" : "text-gray-500 hover:text-gray-700 font-medium"}`}
                                                onClick={() => setCategory(cat)}
                                            >
                                                {EXPENSE_CATEGORY_LABELS[cat]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                                {/* Date picker */}
                                <Popover open={isDatePopoverOpen} onOpenChange={handlePopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="h-9 md:h-10 flex-1 sm:flex-none flex items-center gap-2 px-3 md:px-4 rounded-xl border-2 font-medium text-xs md:text-sm">
                                            <CalendarRange className="w-4 h-4 text-gray-500" />
                                            <span className="whitespace-nowrap">{periodLabel}</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[calc(100vw-2rem)] sm:w-fit p-2" align="end">
                                        <div className="text-sm font-bold mb-3 px-2">
                                            Selecciona rango de fechas
                                        </div>
                                        <div className="flex flex-col">
                                            <Calendar
                                                locale={es}
                                                weekStartsOn={1}
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
                                                        setTempToDate("")
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
                                                        {new Date(tempFromDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                                                        {" – "}
                                                        {new Date(tempToDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
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
                                    </PopoverContent>
                                </Popover>

                                {/* Add invoice button */}
                                <Button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="h-9 md:h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Añadir Factura
                                </Button>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 p-3 md:p-6 overflow-y-auto min-h-0 bg-gray-50/30">
                        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                            {/* Summary card */}
                            <Card className="p-4 md:p-6 shadow-sm border-2 border-gray-100 rounded-2xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Total Gastos del Período</p>
                                        <div className="mt-2 flex items-center gap-2 md:gap-3">
                                            <div className="p-1.5 md:p-2 bg-red-50 rounded-lg">
                                                <Euro className="w-4 h-4 md:w-6 md:h-6 text-red-600" />
                                            </div>
                                            <span className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">
                                                €{(data?.totalExpenses || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge className="bg-gray-100 text-gray-700 font-bold">
                                        {data?.count || 0} facturas
                                    </Badge>
                                </div>
                            </Card>

                            {/* Invoices table */}
                            {data?.invoices && data.invoices.length > 0 ? (
                                <Card className="shadow-sm border-2 border-gray-100 rounded-2xl overflow-hidden bg-white">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                                <tr>
                                                    <th className="px-6 py-3 font-bold">Fecha</th>
                                                    <th className="px-6 py-3 font-bold">Proveedor</th>
                                                    <th className="px-6 py-3 font-bold">Categoría</th>
                                                    <th className="px-6 py-3 font-bold">Referencia</th>
                                                    <th className="px-6 py-3 font-bold text-right">Total</th>
                                                    <th className="px-6 py-3 font-bold text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.invoices.map((invoice: Invoice) => (
                                                    <tr key={invoice.id} className="border-b last:border-0 hover:bg-gray-50/50">
                                                        <td className="px-4 py-3 md:px-6 md:py-4 font-medium text-gray-900">
                                                            {format(new Date(invoice.date), "dd/MM/yyyy")}
                                                        </td>
                                                        <td className="px-4 py-3 md:px-6 md:py-4 font-medium text-gray-900">
                                                            {invoice.supplier}
                                                        </td>
                                                        <td className="px-4 py-3 md:px-6 md:py-4">
                                                            <Badge className={`${getCategoryColor(invoice.category)} font-bold text-xs`}>
                                                                {EXPENSE_CATEGORY_LABELS[invoice.category]}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 md:px-6 md:py-4 text-gray-500">
                                                            {invoice.reference || "—"}
                                                        </td>
                                                        <td className="px-4 py-3 md:px-6 md:py-4 text-right font-bold text-gray-900">
                                                            €{invoice.totalAmount.toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3 md:px-6 md:py-4 text-center">
                                                            <button
                                                                onClick={() => handleDeleteInvoice(invoice.id)}
                                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Eliminar factura"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            ) : (
                                <Card className="p-10 text-center shadow-xl border-2 border-gray-100 rounded-3xl">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <FileText className="w-10 h-10 text-gray-300" />
                                    </div>
                                    <div className="text-2xl font-bold mb-2 text-gray-900">Sin facturas</div>
                                    <div className="text-muted-foreground font-medium">
                                        No hay facturas registradas para el periodo seleccionado.
                                    </div>
                                    <Button
                                        className="mt-8 h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700"
                                        onClick={() => setIsAddModalOpen(true)}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Añadir primera factura
                                    </Button>
                                </Card>
                            )}
                        </div>
                    </main>
                </div>
            )}

            {/* Add invoice modal */}
            <AddInvoiceModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                onSuccess={handleModalSuccess}
            />
        </div>
    )
}
