import { ProductDTO } from "./product.dto"

export interface CategoryDTO {
  id: number
  name: string
  productCount?: number
  products?: ProductDTO[]
}

