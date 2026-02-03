export type SalesPeriod = 'day' | 'week' | 'month' | 'custom'

export interface TodaySales {
  date: string
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  topProducts: { productId: number; name: string; quantity: number }[]
}

export interface SalesAggregate {
  type: SalesPeriod | 'custom'
  start: string
  end: string
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  topProductByUnits?: { productId: number; name: string; quantity: number }
  topProductByRevenue?: { productId: number; name: string; revenue: number }
  categories?: { categoryId: number; name: string; units: number; revenue: number }[]
  products?: { productId: number; name: string; quantity: number; revenue: number }[]
  conversionRate?: number
  purchaseFrequencyPerDay?: number
  topCustomers?: { customerName: string; orders: number; revenue: number }[]
  previous?: { totalSales: number; totalOrders: number; averageOrderValue: number }
}

// AI Scanner types
export interface ScannedSaleItem {
  productId: number
  name: string
  quantity: number
  unitPrice: number
}

export interface ScannedSaleData {
  success: boolean
  totalDetected: number | null
  dateDetected: string | null
  suggestedItems: ScannedSaleItem[]
  approximateTotal: number
  confidence: number
  notes: string | null
  rawText?: string
  ocrConfidence?: number
  error?: string
}

export interface SalesScannerStatus {
  available: boolean
  ocr: boolean
  llm: boolean
  products: number
}
