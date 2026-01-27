export type SalesPeriod = 'day' | 'week' | 'month'

export interface TodaySales {
  date: string
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  topProducts: { productId: number; name: string; quantity: number }[]
}

export interface SalesAggregate {
  type: SalesPeriod
  start: string
  end: string
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  topProductByUnits?: { productId: number; name: string; quantity: number }
  topProductByRevenue?: { productId: number; name: string; revenue: number }
  categories?: { categoryId: number; name: string; units: number; revenue: number }[]
  conversionRate?: number
  purchaseFrequencyPerDay?: number
  topCustomers?: { customerName: string; orders: number; revenue: number }[]
  previous?: { totalSales: number; totalOrders: number; averageOrderValue: number }
}

