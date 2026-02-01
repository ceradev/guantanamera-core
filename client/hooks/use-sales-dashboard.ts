import { useEffect, useMemo, useRef, useState } from 'react'
import { getSales } from '@/services'
import type { SalesAggregate, SalesPeriod } from '@/types'
import { handleApiError } from '@/utils/handleApiError'
import { useNotifications } from '@/hooks/use-notifications'

export function useSalesDashboard() {
  const [data, setData] = useState<SalesAggregate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const errorToastShownRef = useRef(false)
  const loadingRef = useRef(true)
  const liveRefreshInFlightRef = useRef(false)
  const lastDataSignatureRef = useRef<string | null>(null)
  const [type, setType] = useState<SalesPeriod>('day')
  const [date, setDate] = useState<string>(() => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  })
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all')
  const [source, setSource] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  const parseDate = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const fmtISO = (d: Date) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }
  const startOfWeekMonday = (d: Date) => {
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const res = new Date(d)
    res.setDate(d.getDate() + diff)
    res.setHours(0, 0, 0, 0)
    return res
  }
  const addDays = (d: Date, n: number) => {
    const res = new Date(d)
    res.setDate(d.getDate() + n)
    return res
  }
  const onCalendarSelect = (selected?: Date) => {
    if (!selected) return
    const base = type === 'week' ? startOfWeekMonday(selected) : selected
    setDate(fmtISO(base))
  }

  useEffect(() => {
    loadingRef.current = loading
  }, [loading])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const res = await getSales(
        type,
        date,
        source || undefined,
        type === 'custom' ? fromDate : undefined,
        type === 'custom' ? toDate : undefined
      )
      setData(res)
      lastDataSignatureRef.current = `${res.totalOrders}|${res.totalSales}`
      setError(null)
      errorToastShownRef.current = false
    } catch (err: any) {
      setError('error')
      if (!errorToastShownRef.current) {
        handleApiError(err, 'las ventas')
        errorToastShownRef.current = true
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // For custom type, only fetch when both dates are set
    if (type === 'custom' && (!fromDate || !toDate)) return
    fetchSales()
  }, [type, date, source, fromDate, toDate])

  useNotifications({ onOrdersUpdated: fetchSales })

  const periodLabel = useMemo(() => {
    const base = new Date(date)
    const fmt = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    if (!data) return ''
    const start = new Date(data.start)
    const end = new Date(data.end)
    if (type === 'day') return fmt(base)
    if (type === 'week') return `${fmt(start)} – ${fmt(end)}`
    if (type === 'custom' && fromDate && toDate) {
      return `${fmt(new Date(fromDate))} – ${fmt(new Date(toDate))}`
    }
    return `${start.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
  }, [data, type, date, fromDate, toDate])

  const deltaSales = useMemo(() => {
    if (!data?.previous) return null
    const prev = data.previous.totalSales || 0
    const curr = data.totalSales || 0
    if (prev === 0) return null
    return ((curr - prev) / prev) * 100
  }, [data])

  const deltaOrders = useMemo(() => {
    if (!data?.previous) return null
    const prev = data.previous.totalOrders || 0
    const curr = data.totalOrders || 0
    if (prev === 0) return null
    return ((curr - prev) / prev) * 100
  }, [data])

  const deltaAOV = useMemo(() => {
    if (!data?.previous) return null
    const prev = data.previous.averageOrderValue || 0
    const curr = data.averageOrderValue || 0
    if (prev === 0) return null
    return ((curr - prev) / prev) * 100
  }, [data])

  const categoriesData = useMemo(() => {
    if (!data?.categories) return []
    return data.categories
      .filter((c) => (selectedCategoryId === 'all' ? true : c.categoryId === selectedCategoryId))
      .map((c) => ({ name: c.name, revenue: c.revenue, units: c.units }))
  }, [data, selectedCategoryId])

  const chartConfig = useMemo(() => {
    return {
      revenue: { label: 'Ingresos', color: 'hsl(0, 80%, 55%)' },
      units: { label: 'Unidades', color: 'hsl(210, 80%, 55%)' },
    }
  }, [])

  const exportCSV = () => {
    if (!data) return
    const rows: string[] = []
    
    // Header
    rows.push(['REPORTE DE VENTAS', ''].join(','))
    rows.push(['Periodo', periodLabel].join(','))
    rows.push(['Generado el', new Date().toLocaleString('es-ES')].join(','))
    rows.push('') // Empty line
    
    // Summary
    rows.push(['RESUMEN', ''].join(','))
    rows.push(['Total Vendido (€)', data.totalSales.toFixed(2)].join(','))
    rows.push(['Nº de Pedidos', data.totalOrders.toString()].join(','))
    rows.push(['Ticket Medio (€)', data.averageOrderValue.toFixed(2)].join(','))
    rows.push('') // Empty line

    // Top Products
    if (data.topProductByUnits || data.topProductByRevenue) {
      rows.push(['PRODUCTOS DESTACADOS', ''].join(','))
      if (data.topProductByUnits) {
        rows.push(['Más vendido (unidades)', `${data.topProductByUnits.name} (${data.topProductByUnits.quantity})`].join(','))
      }
      if (data.topProductByRevenue) {
        rows.push(['Más ingresos', `${data.topProductByRevenue.name} (€${data.topProductByRevenue.revenue.toFixed(2)})`].join(','))
      }
      rows.push('') // Empty line
    }

    // Categories Table
    rows.push(['DETALLE POR CATEGORÍA', '', ''].join(','))
    rows.push(['Categoría', 'Unidades', 'Ingresos (€)'].join(','))
    ;(data.categories || []).forEach((c) => {
      rows.push([`"${c.name}"`, c.units.toString(), c.revenue.toFixed(2)].join(','))
    })

    const csv = rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Reporte_Ventas_${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = async () => {
    if (!data) return
    
    // Dynamically import jspdf to avoid SSR issues
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width

    // Title
    doc.setFontSize(22)
    doc.setTextColor(40, 40, 40)
    doc.text('Reporte de Ventas', pageWidth / 2, 20, { align: 'center' })

    // Period Info
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(`Periodo: ${periodLabel}`, pageWidth / 2, 30, { align: 'center' })
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth / 2, 36, { align: 'center' })

    // Summary Box
    doc.setDrawColor(200, 200, 200)
    doc.setFillColor(250, 250, 250)
    doc.roundedRect(14, 45, pageWidth - 28, 35, 3, 3, 'FD')

    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('Resumen General', 20, 55)

    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    
    // Summary Metrics Grid
    const colWidth = (pageWidth - 40) / 3
    
    // Total Sales
    doc.text('Total Vendido', 20, 65)
    doc.setFontSize(16)
    doc.setTextColor(220, 38, 38) // Red color for money
    doc.text(`€${data.totalSales.toFixed(2)}`, 20, 73)
    
    // Orders
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text('Nº Pedidos', 20 + colWidth, 65)
    doc.setFontSize(16)
    doc.setTextColor(40, 40, 40)
    doc.text(data.totalOrders.toString(), 20 + colWidth, 73)

    // AOV
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text('Ticket Medio', 20 + (colWidth * 2), 65)
    doc.setFontSize(16)
    doc.setTextColor(40, 40, 40)
    doc.text(`€${data.averageOrderValue.toFixed(2)}`, 20 + (colWidth * 2), 73)

    let yPos = 90

    // Top Products Section
    if (data.topProductByUnits || data.topProductByRevenue) {
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text('Productos Destacados', 14, yPos)
      yPos += 8

      const topProductsData = []
      if (data.topProductByUnits) {
        topProductsData.push(['Más vendido (unidades)', data.topProductByUnits.name, `${data.topProductByUnits.quantity} u.`])
      }
      if (data.topProductByRevenue) {
        topProductsData.push(['Más ingresos', data.topProductByRevenue.name, `€${data.topProductByRevenue.revenue.toFixed(2)}`])
      }

      autoTable(doc, {
        startY: yPos,
        head: [['Criterio', 'Producto', 'Valor']],
        body: topProductsData,
        theme: 'striped',
        headStyles: { fillColor: [40, 40, 40] },
        styles: { fontSize: 10 },
        margin: { left: 14, right: 14 }
      })

      // Update yPos based on table end
      yPos = (doc as any).lastAutoTable.finalY + 15
    }

    // Categories Table
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text('Desglose por Categoría', 14, yPos)
    yPos += 6

    const categoryRows = (data.categories || []).map(c => [
      c.name,
      c.units.toString(),
      `€${c.revenue.toFixed(2)}`
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Categoría', 'Unidades', 'Ingresos']],
      body: categoryRows,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] }, // Red header
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    })

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages()
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text('Documento generado automáticamente por Guantanamera', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' })
    }

    doc.save(`Reporte_Ventas_${date}.pdf`)
  }

  return {
    data,
    loading,
    error,
    type,
    setType,
    date,
    setDate,
    selectedCategoryId,
    setSelectedCategoryId,
    source,
    setSource,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
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
    exportPDF,
  }
}
