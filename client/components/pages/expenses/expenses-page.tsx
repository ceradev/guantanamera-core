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
    Eye,
    Download,
    Building2,
    Search,
    ChevronDown,
} from "lucide-react"
import { es } from "date-fns/locale"
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths } from "date-fns"
import { getInvoices, getSuppliers, deleteInvoice as deleteInvoiceApi } from "@/services"
import type { Invoice, InvoicesResponse, Supplier } from "@/types"
import { AddInvoiceModal } from "./components/add-invoice-modal"
import { InvoiceDetailModal } from "./components/invoice-detail-modal"

export default function ExpensesPage() {
    // Client-side hydration state
    const [isClient, setIsClient] = useState(false)

    // Date range state - initialized empty, set on client
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")
    const [tempFromDate, setTempFromDate] = useState("")
    const [tempToDate, setTempToDate] = useState("")
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
    const [isSupplierPopoverOpen, setIsSupplierPopoverOpen] = useState(false)
    const [supplierSearch, setSupplierSearch] = useState("")

    // Filter state
    const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])

    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        s.fiscalId?.toLowerCase().includes(supplierSearch.toLowerCase())
    )

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

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

    const setPeriod = (type: 'month' | 'quarter' | 'year' | 'lastMonth') => {
        const now = new Date()
        let start, end
        switch (type) {
            case 'month':
                start = startOfMonth(now)
                end = endOfMonth(now)
                break
            case 'lastMonth':
                const last = subMonths(now, 1)
                start = startOfMonth(last)
                end = endOfMonth(last)
                break
            case 'quarter':
                start = startOfQuarter(now)
                end = endOfQuarter(now)
                break
            case 'year':
                start = startOfYear(now)
                end = endOfYear(now)
                break
        }
        if (start && end) {
            setFromDate(fmtISO(start))
            setToDate(fmtISO(end))
            setIsDatePopoverOpen(false)
        }
    }

    const toggleSupplier = (id: string) => {
        setSelectedSupplierIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    // Fetch suppliers
    const fetchSuppliers = useCallback(async () => {
        try {
            const result = await getSuppliers()
            setSuppliers(result)
        } catch (e) {
            console.error("Error fetching suppliers:", e)
        }
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
                supplierIds: selectedSupplierIds.length > 0 ? selectedSupplierIds : undefined,
            })
            setData(response)
        } catch (e) {
            setError(e as Error)
        } finally {
            setIsLoading(false)
        }
    }, [fromDate, toDate, selectedSupplierIds])

    useEffect(() => {
        if (isClient) {
            fetchData()
            fetchSuppliers()
        }
    }, [fetchData, fetchSuppliers, isClient])

    const handleDeleteInvoice = useCallback(async (id: string) => {
        if (confirm("¿Estás seguro de eliminar esta factura?")) {
            try {
                await deleteInvoiceApi(id)
                fetchData()
                fetchSuppliers()
            } catch (e) {
                console.error("Error deleting invoice:", e)
            }
        }
    }, [fetchData, fetchSuppliers])

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
        fetchSuppliers()
    }

    // Period label - only calculate when dates are available
    const periodLabel = fromDate && toDate
        ? `${format(new Date(fromDate), "d MMM", { locale: es })} - ${format(new Date(toDate), "d MMM yyyy", { locale: es })}`
        : "Cargando..."

    const exportCSV = useCallback(() => {
        if (!data?.invoices.length) return
        const rows: string[] = []
        
        rows.push(["REPORTE DE GASTOS / FACTURAS", ""].join(","))
        rows.push(["Periodo", periodLabel].join(","))
        rows.push(["Generado el", new Date().toLocaleString("es-ES")].join(","))
        
        if (selectedSupplierIds.length > 0) {
            const names = selectedSupplierIds.map(id => suppliers.find(s => s.id === id)?.name).filter(Boolean)
            rows.push([`Filtrado por proveedor`, `"${names.join(', ')}"`].join(","))
        }
        rows.push("")
        
        rows.push(["RESUMEN", ""].join(","))
        rows.push(["Total Gastos (€)", data.totals.totalAmount.toFixed(2)].join(","))
        rows.push(["Nº de Facturas", data.totals.count.toString()].join(","))
        rows.push("")

        rows.push(["LISTADO DE FACTURAS", "", "", ""].join(","))
        rows.push(["Fecha", "Proveedor", "Referencia", "Total (€)"].join(","))
        data.invoices.forEach((inv) => {
            rows.push([
                format(new Date(inv.date), "dd/MM/yyyy"),
                `"${inv.supplier.name}"`,
                `"${inv.reference || ""}"`,
                inv.totalAmount.toFixed(2)
            ].join(","))
        })

        const csv = rows.join("\n")
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `Reporte_Gastos_${fromDate}_${toDate}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }, [data, fromDate, toDate, periodLabel, selectedSupplierIds, suppliers])

    const exportPDF = useCallback(async () => {
        if (!data?.invoices.length) return
        
        const { jsPDF } = await import("jspdf")
        const autoTable = (await import("jspdf-autotable")).default

        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.width

        doc.setFontSize(22)
        doc.setTextColor(40, 40, 40)
        doc.text("Reporte de Gastos", pageWidth / 2, 20, { align: "center" })

        doc.setFontSize(12)
        doc.setTextColor(100, 100, 100)
        doc.text(`Periodo: ${periodLabel}`, pageWidth / 2, 30, { align: "center" })
        doc.text(`Generado: ${new Date().toLocaleString("es-ES")}`, pageWidth / 2, 36, { align: "center" })

        doc.setDrawColor(200, 200, 200)
        doc.setFillColor(250, 250, 250)
        doc.roundedRect(14, 45, pageWidth - 28, 25, 3, 3, "FD")

        doc.setFontSize(10)
        doc.setTextColor(80, 80, 80)
        doc.text("Total Gastos", 20, 55)
        doc.setFontSize(16)
        doc.setTextColor(220, 38, 38)
        doc.text(`€${data.totals.totalAmount.toFixed(2)}`, 20, 63)

        doc.setFontSize(10)
        doc.setTextColor(80, 80, 80)
        doc.text("Nº Facturas", pageWidth - 60, 55)
        doc.setFontSize(16)
        doc.setTextColor(40, 40, 40)
        doc.text(data.totals.count.toString(), pageWidth - 60, 63)

        let currentY = 80

        // Group by supplier
        const grouped = data.invoices.reduce((acc: Record<string, Invoice[]>, inv) => {
            const name = inv.supplier.name
            if (!acc[name]) acc[name] = []
            acc[name].push(inv)
            return acc
        }, {})

        Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).forEach(([supplierName, invoices]) => {
            if (currentY > 240) {
                doc.addPage()
                currentY = 20
            }

            doc.setFontSize(12)
            doc.setTextColor(0, 0, 0)
            doc.text(supplierName, 14, currentY + 5)
            currentY += 10

            const tableRows = invoices.map(inv => [
                format(new Date(inv.date), "dd/MM/yyyy"),
                inv.reference || "—",
                `€${inv.totalAmount.toFixed(2)}`
            ])

            autoTable(doc, {
                startY: currentY,
                head: [["Fecha", "Referencia", "Total"]],
                body: tableRows,
                theme: "grid",
                headStyles: { fillColor: [220, 38, 38] },
                styles: { fontSize: 9 },
                columnStyles: { 2: { halign: "right" } },
                margin: { left: 14, right: 14 }
            })

            currentY = (doc as any).lastAutoTable.finalY + 15
        })

        doc.save(`Reporte_Gastos_${fromDate}_${toDate}.pdf`)
    }, [data, fromDate, toDate, periodLabel])

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
                                    {/* Supplier filter */}
                                    <Popover open={isSupplierPopoverOpen} onOpenChange={setIsSupplierPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="h-10 rounded-xl border-2 font-bold text-sm px-4 flex items-center gap-2 bg-gray-50 border-gray-100">
                                                <Building2 className="w-4 h-4 text-gray-500" />
                                                {selectedSupplierIds.length === 0 ? "Todos los Proveedores" : `${selectedSupplierIds.length} Seleccionados`}
                                                <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-72 p-0" align="start">
                                            <div className="p-3 border-b bg-gray-50">
                                                <div className="relative">
                                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <input 
                                                        placeholder="Buscar proveedor..." 
                                                        className="w-full pl-8 pr-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                                        value={supplierSearch}
                                                        onChange={(e) => setSupplierSearch(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto p-1">
                                                {filteredSuppliers.length > 0 ? (
                                                    filteredSuppliers.map(s => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => toggleSupplier(s.id)}
                                                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm transition-colors"
                                                        >
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedSupplierIds.includes(s.id) ? 'bg-red-600 border-red-600' : 'border-gray-300'}`}>
                                                                {selectedSupplierIds.includes(s.id) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                            </div>
                                                            <div className="flex flex-col items-start">
                                                                <span className="font-medium text-gray-700">{s.name}</span>
                                                                {s.fiscalId && <span className="text-[10px] text-gray-400">{s.fiscalId}</span>}
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-xs text-gray-500">
                                                        No se encontraron proveedores
                                                    </div>
                                                )}
                                            </div>
                                            {selectedSupplierIds.length > 0 && (
                                                <div className="p-2 border-t bg-gray-50 flex justify-between">
                                                    <button 
                                                        onClick={() => setSelectedSupplierIds([])}
                                                        className="text-xs font-bold text-gray-500 hover:text-red-600 px-2 py-1"
                                                    >
                                                        Limpiar
                                                    </button>
                                                    <button 
                                                        onClick={() => setIsSupplierPopoverOpen(false)}
                                                        className="text-xs font-bold text-red-600 hover:text-red-700 px-2 py-1"
                                                    >
                                                        Aplicar
                                                    </button>
                                                </div>
                                            )}
                                        </PopoverContent>
                                    </Popover>
                                    <Button variant="ghost" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('changePage', { detail: 'suppliers' }))} className="text-red-600 font-bold text-xs hover:bg-red-50 rounded-lg">
                                        <Building2 className="w-3.5 h-3.5 mr-1.5" />
                                        Gestionar Proveedores
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                                {/* Date picker */}
                                <Popover open={isDatePopoverOpen} onOpenChange={handlePopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="h-9 md:h-10 flex-1 sm:flex-none flex items-center gap-2 px-3 md:px-4 rounded-xl border-2 font-medium text-xs md:text-sm">
                                            <CalendarRange className="w-4 h-4 text-gray-500" />
                                            <span className="whitespace-nowrap">{periodLabel}</span>
                                            <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-fit p-4" align="end">
                                        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4">
                                            <div className="space-y-1 pr-4 md:border-r">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Preajustes</p>
                                                <button onClick={() => setPeriod('month')} className="w-full text-left px-3 py-2 text-sm font-bold hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">Mes Actual</button>
                                                <button onClick={() => setPeriod('lastMonth')} className="w-full text-left px-3 py-2 text-sm font-bold hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">Mes Pasado</button>
                                                <button onClick={() => setPeriod('quarter')} className="w-full text-left px-3 py-2 text-sm font-bold hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">Trimestre Actual</button>
                                                <button onClick={() => setPeriod('year')} className="w-full text-left px-3 py-2 text-sm font-bold hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">Año Actual</button>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 ml-2">Rango Personalizado</p>
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
                                                    numberOfMonths={1}
                                                />
                                                <div className="flex items-center justify-end mt-4">
                                                    <Button
                                                        size="sm"
                                                        disabled={!tempFromDate || !tempToDate}
                                                        onClick={handleConfirmCustomDates}
                                                        className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg px-6"
                                                    >
                                                        Confirmar
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                <div className="flex items-center gap-2 flex-1 sm:flex-none">
                                    <Button
                                        variant="outline"
                                        onClick={exportCSV}
                                        className="h-9 md:h-10 flex-1 px-3 md:px-4 rounded-xl border-2 font-medium text-xs md:text-sm hover:bg-gray-50"
                                        title="Exportar CSV"
                                    >
                                        <Download className="w-4 h-4 sm:mr-2" />
                                        <span className="hidden sm:inline">CSV</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={exportPDF}
                                        className="h-9 md:h-10 flex-1 px-3 md:px-4 rounded-xl border-2 font-medium text-xs md:text-sm hover:bg-gray-50 text-red-600 border-red-100 hover:border-red-200 hover:bg-red-50"
                                        title="Exportar PDF"
                                    >
                                        <FileText className="w-4 h-4 sm:mr-2" />
                                        <span className="hidden sm:inline">PDF</span>
                                    </Button>
                                </div>

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
                                                €{(data?.totals.totalAmount || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge className="bg-gray-100 text-gray-700 font-bold">
                                        {data?.totals.count || 0} facturas
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
                                                            {invoice.supplier.name}
                                                        </td>
                                                        <td className="px-4 py-3 md:px-6 md:py-4 text-gray-500">
                                                            {invoice.reference || "—"}
                                                        </td>
                                                        <td className="px-4 py-3 md:px-6 md:py-4 text-right font-bold text-gray-900">
                                                            €{invoice.totalAmount.toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3 md:px-6 md:py-4 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedInvoice(invoice)
                                                                        setIsDetailModalOpen(true)
                                                                    }}
                                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Ver detalle"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteInvoice(invoice.id)}
                                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Eliminar factura"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
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

            {/* Invoice detail modal */}
            <InvoiceDetailModal
                open={isDetailModalOpen}
                onOpenChange={setIsDetailModalOpen}
                invoice={selectedInvoice}
            />
        </div>
    )
}
