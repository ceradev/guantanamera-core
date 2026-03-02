"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card } from "@/components/ui/data-display/card"
import { Badge } from "@/components/ui/data-display/badge"
import { Button } from "@/components/ui/buttons/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/overlays/popover"
import { Calendar } from "@/components/ui/inputs/calendar"
import Skeleton from "react-loading-skeleton"
import {
    Euro,
    CalendarRange,
    FileText,
    Download,
    TrendingUp,
    Building2,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    ChevronDown,
    Printer
} from "lucide-react"
import { es } from "date-fns/locale"
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subMonths, startOfYear, endOfYear } from "date-fns"
import { getInvoiceReport, getSuppliers } from "@/services"
import type { Supplier, InvoiceReport, Invoice } from "@/types"
import { useToast } from "@/hooks/use-toast"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts"

export default function ReportsPage() {
    const { toast } = useToast()
    const [isClient, setIsClient] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const [report, setReport] = useState<InvoiceReport | null>(null)
    
    // Filters
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")
    const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [supplierSearch, setSupplierSearch] = useState("")
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
    const [isSupplierPopoverOpen, setIsSupplierPopoverOpen] = useState(false)

    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        s.fiscalId?.toLowerCase().includes(supplierSearch.toLowerCase())
    )

    const fmtISO = (d: Date) => format(d, "yyyy-MM-dd")

    useEffect(() => {
        setFromDate(format(startOfMonth(new Date()), "yyyy-MM-dd"))
        setToDate(format(endOfMonth(new Date()), "yyyy-MM-dd"))
        setIsClient(true)
    }, [])

    const fetchSuppliers = useCallback(async () => {
        try {
            const result = await getSuppliers()
            setSuppliers(result)
        } catch (e) {
            console.error("Error fetching suppliers:", e)
        }
    }, [])

    const fetchReport = useCallback(async () => {
        if (!fromDate || !toDate) return
        
        // Prevent invalid ranges
        if (new Date(fromDate) > new Date(toDate)) {
            toast({ title: "Rango inválido", description: "La fecha de inicio no puede ser posterior a la de fin", variant: "destructive" })
            return
        }

        setIsLoading(true)
        try {
            const result = await getInvoiceReport({
                from: fromDate,
                to: toDate,
                supplierIds: selectedSupplierIds.length > 0 ? selectedSupplierIds : undefined
            })
            setReport(result)
        } catch (e) {
            setError(e as Error)
        } finally {
            setIsLoading(false)
        }
    }, [fromDate, toDate, selectedSupplierIds])

    useEffect(() => {
        if (isClient) {
            fetchReport()
            fetchSuppliers()
        }
    }, [isClient, fetchReport, fetchSuppliers])

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

    const periodLabel = fromDate && toDate
        ? `${format(new Date(fromDate), "d MMM", { locale: es })} - ${format(new Date(toDate), "d MMM yyyy", { locale: es })}`
        : "Cargando..."

    const exportCSV = useCallback(() => {
        if (!report) return
        const rows: string[] = []
        
        rows.push(["REPORTE EJECUTIVO DE GASTOS", ""].join(","))
        rows.push(["Periodo", periodLabel].join(","))
        rows.push(["Generado el", new Date().toLocaleString("es-ES")].join(","))
        rows.push("")
        
        rows.push(["RESUMEN GENERAL", ""].join(","))
        rows.push(["Concepto", "Valor"].join(","))
        rows.push(["Total Base Imponible (€)", report.summary.totalBase.toFixed(2)].join(","))
        rows.push(["Total Impuestos (€)", report.summary.totalTax.toFixed(2)].join(","))
        rows.push(["Total Facturado (€)", report.summary.totalAmount.toFixed(2)].join(","))
        rows.push(["Nº de Facturas", report.summary.count.toString()].join(","))
        rows.push("")

        rows.push(["SUBTOTALES POR PROVEEDOR", "", "", "", ""].join(","))
        rows.push(["Proveedor", "Facturas", "Base (€)", "Impuestos (€)", "Total (€)"].join(","))
        report.supplierSubtotals.forEach((s) => {
            rows.push([
                `"${s.supplierName}"`,
                s.count.toString(),
                s.totalBase.toFixed(2),
                s.totalTax.toFixed(2),
                s.totalAmount.toFixed(2)
            ].join(","))
        })
        
        rows.push("")
        rows.push(["TENDENCIA MENSUAL", "", ""].join(","))
        rows.push(["Mes", "Facturas", "Total (€)"].join(","))
        report.trends.forEach((t) => {
            rows.push([t.month, t.count.toString(), t.totalAmount.toFixed(2)].join(","))
        })

        const csv = rows.join("\n")
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `Reporte_Ejecutivo_${fromDate}_${toDate}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }, [report, fromDate, toDate, periodLabel])

    const exportPDF = useCallback(async () => {
        if (!report) return
        
        const { jsPDF } = await import("jspdf")
        const autoTable = (await import("jspdf-autotable")).default

        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.width

        // Header
        doc.setFontSize(22)
        doc.setTextColor(40, 40, 40)
        doc.text("Reporte Consolidado de Facturas", pageWidth / 2, 20, { align: "center" })

        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(`Periodo: ${periodLabel}`, pageWidth / 2, 28, { align: "center" })
        doc.text(`Generado: ${new Date().toLocaleString("es-ES")}`, pageWidth / 2, 33, { align: "center" })

        // Summary Box
        doc.setDrawColor(220, 220, 220)
        doc.setFillColor(250, 250, 250)
        doc.roundedRect(14, 40, pageWidth - 28, 30, 3, 3, "FD")

        doc.setFontSize(9)
        doc.setTextColor(80, 80, 80)
        doc.text("BASE IMPONIBLE", 20, 50)
        doc.text("TOTAL IMPUESTOS (IGIC)", pageWidth / 2, 50, { align: "center" })
        doc.text("TOTAL FACTURADO", pageWidth - 20, 50, { align: "right" })

        doc.setFontSize(14)
        doc.setTextColor(40, 40, 40)
        doc.text(`€${report.summary.totalBase.toFixed(2)}`, 20, 60)
        doc.text(`€${report.summary.totalTax.toFixed(2)}`, pageWidth / 2, 60, { align: "center" })
        doc.setTextColor(220, 38, 38)
        doc.text(`€${report.summary.totalAmount.toFixed(2)}`, pageWidth - 20, 60, { align: "right" })

        let currentY = 80

        // Group invoices by supplier
        const grouped = report.invoices.reduce((acc: Record<string, Invoice[]>, inv) => {
            if (!acc[inv.supplier.name]) acc[inv.supplier.name] = []
            acc[inv.supplier.name].push(inv)
            return acc
        }, {})

        // For each supplier
        Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).forEach(([supplierName, invoices]) => {
            const supplier = invoices[0].supplier
            
            // Check for page overflow
            if (currentY > 240) {
                doc.addPage()
                currentY = 20
            }

            // Supplier Header
            doc.setFillColor(240, 240, 240)
            doc.rect(14, currentY, pageWidth - 28, 15, "F")
            doc.setFontSize(11)
            doc.setTextColor(0, 0, 0)
            doc.text(supplierName, 18, currentY + 10)
            
            doc.setFontSize(8)
            doc.setTextColor(100, 100, 100)
            const fiscalInfo = `${supplier.fiscalId || ""} | ${supplier.address || ""}`
            doc.text(fiscalInfo, pageWidth - 18, currentY + 10, { align: "right" })
            
            currentY += 15

            // Table for this supplier
            const tableRows = invoices.map(inv => [
                format(new Date(inv.date), "dd/MM/yyyy"),
                inv.reference || "—",
                `€${inv.baseAmount.toFixed(2)}`,
                `€${inv.taxAmount.toFixed(2)}`,
                `€${inv.totalAmount.toFixed(2)}`
            ])

            autoTable(doc, {
                startY: currentY,
                head: [["Fecha", "Referencia", "Base", "IGIC", "Total"]],
                body: tableRows,
                theme: "grid",
                headStyles: { fillColor: [60, 60, 60], fontSize: 8 },
                styles: { fontSize: 8 },
                columnStyles: { 
                    2: { halign: "right" },
                    3: { halign: "right" },
                    4: { halign: "right", fontStyle: "bold" }
                },
                margin: { left: 14, right: 14 }
            })

            const subtotal = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
            currentY = (doc as any).lastAutoTable.finalY + 10

            doc.setFontSize(9)
            doc.setTextColor(0, 0, 0)
            doc.text(`Subtotal ${supplierName}: €${subtotal.toFixed(2)}`, pageWidth - 14, currentY, { align: "right" })
            
            currentY += 15
        })

        // Footer with page numbers
        const pageCount = (doc as any).internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: "center" })
        }

        doc.save(`Reporte_Facturas_${fromDate}_${toDate}.pdf`)
    }, [report, fromDate, toDate, periodLabel])

    if (!isClient) return null

    return (
        <div className="flex-1 flex flex-col bg-gray-50/30 overflow-hidden h-full">
            <header className="bg-white border-b px-4 md:px-8 py-6 shrink-0">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-red-600" />
                            Reportes de Proveedores
                        </h1>
                        <p className="text-muted-foreground mt-1 text-xs md:text-sm font-medium">Análisis de gastos, impuestos y tendencias</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Supplier Multi-select */}
                        <Popover open={isSupplierPopoverOpen} onOpenChange={setIsSupplierPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-10 rounded-xl border-2 font-bold text-sm px-4 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-gray-500" />
                                    {selectedSupplierIds.length === 0 ? "Todos los Proveedores" : `${selectedSupplierIds.length} Proveedores`}
                                    <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-0" align="end">
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

                        {/* Date Picker with Presets */}
                        <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-10 rounded-xl border-2 font-bold text-sm px-4 flex items-center gap-2">
                                    <CalendarRange className="w-4 h-4 text-gray-500" />
                                    {periodLabel}
                                    <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-fit p-4" align="end">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Preajustes</p>
                                        <button onClick={() => setPeriod('month')} className="w-full text-left px-3 py-2 text-sm font-bold hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">Mes Actual</button>
                                        <button onClick={() => setPeriod('lastMonth')} className="w-full text-left px-3 py-2 text-sm font-bold hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">Mes Pasado</button>
                                        <button onClick={() => setPeriod('quarter')} className="w-full text-left px-3 py-2 text-sm font-bold hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">Trimestre Actual</button>
                                        <button onClick={() => setPeriod('year')} className="w-full text-left px-3 py-2 text-sm font-bold hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">Año Actual</button>
                                    </div>
                                    <div className="border-l pl-4">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Personalizado</p>
                                        <Calendar
                                            mode="range"
                                            selected={fromDate && toDate ? { from: new Date(fromDate), to: new Date(toDate) } : undefined}
                                            onSelect={(range) => {
                                                if (range?.from) setFromDate(fmtISO(range.from))
                                                if (range?.to) setToDate(fmtISO(range.to))
                                            }}
                                            locale={es}
                                        />
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Button
                            onClick={exportPDF}
                            disabled={!report}
                            variant="outline"
                            className="h-10 rounded-xl border-2 border-red-100 text-red-600 hover:bg-red-50 font-bold text-sm flex items-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            Imprimir PDF
                        </Button>

                        <Button
                            onClick={exportCSV}
                            disabled={!report}
                            className="h-10 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-sm flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Excel / CSV
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-8">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <Skeleton key={i} height={120} className="rounded-2xl" />)}
                        </div>
                    ) : report ? (
                        <>
                            {/* Summary Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="p-6 border-2 border-gray-100 shadow-sm rounded-2xl bg-white relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 w-24 h-24 bg-red-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Base Imponible Total</p>
                                    <div className="mt-4 flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-gray-900">€{report.summary.totalBase.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-1 text-green-600 font-bold text-xs">
                                        <ArrowUpRight className="w-4 h-4" />
                                        <span>Consolidado</span>
                                    </div>
                                </Card>

                                <Card className="p-6 border-2 border-gray-100 shadow-sm rounded-2xl bg-white relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Impuestos (IGIC)</p>
                                    <div className="mt-4 flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-gray-900">€{report.summary.totalTax.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <p className="mt-2 text-xs font-medium text-gray-400">Calculado sobre base imponible</p>
                                </Card>

                                <Card className="p-6 border-2 border-red-100 shadow-md shadow-red-500/5 rounded-2xl bg-white relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 w-24 h-24 bg-red-600 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Facturado</p>
                                    <div className="mt-4 flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-red-600">€{report.summary.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <Badge className="bg-red-50 text-red-600 border-red-100 font-black">{report.summary.count} FACTURAS</Badge>
                                    </div>
                                </Card>
                            </div>

                            {/* Trends and Supplier Breakdown */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Supplier Breakdown */}
                                <Card className="border-2 border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                                    <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
                                        <h3 className="font-black text-gray-900 flex items-center gap-2">
                                            <Building2 className="w-5 h-5 text-red-600" />
                                            Gastos por Proveedor
                                        </h3>
                                        <span className="text-xs font-bold text-gray-400 uppercase">{report.supplierSubtotals.length} Proveedores</span>
                                    </div>
                                    <div className="divide-y overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400">
                                                <tr>
                                                    <th className="px-6 py-3">Proveedor</th>
                                                    <th className="px-6 py-3 text-center">Cant.</th>
                                                    <th className="px-6 py-3 text-right">Base</th>
                                                    <th className="px-6 py-3 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {report.supplierSubtotals.map((s, i) => (
                                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-gray-900">{s.supplierName}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <Badge variant="outline" className="font-bold border-gray-200">{s.count}</Badge>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-gray-500">€{s.totalBase.toFixed(2)}</td>
                                                        <td className="px-6 py-4 text-right font-black text-gray-900">€{s.totalAmount.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>

                                {/* Monthly Trends */}
                                <Card className="border-2 border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                                    <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
                                        <h3 className="font-black text-gray-900 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-red-600" />
                                            Evolución Mensual
                                        </h3>
                                        <Badge className="bg-green-50 text-green-700 border-green-100 font-black">ACTUALIZADO</Badge>
                                    </div>
                                    <div className="p-6 h-[400px]">
                                        {report.trends.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={report.trends} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                    <XAxis 
                                                        dataKey="month" 
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                                                        tickFormatter={(val) => format(new Date(val), 'MMM yy', { locale: es }).toUpperCase()}
                                                    />
                                                    <YAxis 
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                                                        tickFormatter={(val) => `€${val}`}
                                                    />
                                                    <Tooltip 
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                        formatter={(value: number) => [`€${value.toFixed(2)}`, 'Total Facturado']}
                                                        labelFormatter={(label) => format(new Date(label as string), 'MMMM yyyy', { locale: es })}
                                                    />
                                                    <Bar 
                                                        dataKey="totalAmount" 
                                                        radius={[6, 6, 0, 0]}
                                                        barSize={40}
                                                    >
                                                        {report.trends.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={index === report.trends.length - 1 ? '#ef4444' : '#fee2e2'} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                                <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
                                                <p className="font-bold">No hay datos de tendencias</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        </>
                    ) : (
                        <div className="py-20 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Filter className="w-10 h-10 text-gray-300" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">Sin datos disponibles</h2>
                            <p className="text-gray-500 font-medium">Ajusta los filtros para visualizar el reporte ejecutivo.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
