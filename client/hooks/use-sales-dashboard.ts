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
      const res = await getSales(type, date, source || undefined)
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
    fetchSales()
  }, [type, date, source])

  useNotifications({ onOrdersUpdated: fetchSales })

  const periodLabel = useMemo(() => {
    const base = new Date(date)
    const fmt = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    if (!data) return ''
    const start = new Date(data.start)
    const end = new Date(data.end)
    if (type === 'day') return fmt(base)
    if (type === 'week') return `${fmt(start)} – ${fmt(end)}`
    return `${start.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
  }, [data, type, date])

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
    rows.push(['Tipo', data.type].join(','))
    rows.push(['Inicio', data.start].join(','))
    rows.push(['Fin', data.end].join(','))
    rows.push(['Total vendido', data.totalSales.toFixed(2)].join(','))
    rows.push(['Nº de pedidos', data.totalOrders.toString()].join(','))
    rows.push(['Ticket medio', data.averageOrderValue.toFixed(2)].join(','))
    if (data.topProductByUnits) {
      rows.push(['Top producto por unidades', data.topProductByUnits.name, data.topProductByUnits.quantity.toString()].join(','))
    }
    if (data.topProductByRevenue) {
      rows.push(['Top producto por ingresos', data.topProductByRevenue.name, data.topProductByRevenue.revenue.toFixed(2)].join(','))
    }
    rows.push(['Categoría', 'Unidades', 'Ingresos'].join(','))
    ;(data.categories || []).forEach((c) => {
      rows.push([c.name, c.units.toString(), c.revenue.toFixed(2)].join(','))
    })
    const csv = rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ventas_${data.type}_${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
  }
}
