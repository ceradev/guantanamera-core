export interface Product {
  id: number
  name: string
  price: number
  active: boolean
  categoryId: number
}

export interface Category {
  id: number
  name: string
  productCount?: number
  products?: Product[]
}

