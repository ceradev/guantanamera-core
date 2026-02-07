import { API_URL, getHeaders } from '@/config/api-config'

export class ApiError extends Error {
  status?: number
  type: 'http' | 'network'
  constructor(message: string, status?: number, type: 'http' | 'network' = 'http') {
    super(message)
    this.status = status
    this.type = type
  }
}

export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}, isProtected: boolean = false): Promise<T> {
  const url = `${API_URL}${endpoint}`
  const headers = getHeaders(isProtected)

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        typeof (errorData as any)?.error === 'string' ? (errorData as any).error : 'Error en la solicitud',
        response.status,
        'http'
      )
    }

    if (response.status === 204) {
      return {} as T
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError('Problema de conexión con el servidor.', undefined, 'network')
  }
}

export type {
  Category,
  Product,
  OrderItem,
  Order,
  CreateOrderPayload,
  PaginatedResponse,
  TodaySales,
  SalesAggregate,
  SalesPeriod,
} from '@/types'

export {
  getPublicMenu,
  getCategories,
  getAdminMenu,
  createCategory,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/services'

export { createOrder, getOrders, getOrderById, updateOrderStatus } from '@/services'
export { getSalesToday, getSales } from '@/services'
