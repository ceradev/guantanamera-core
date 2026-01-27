import type { Product } from "@prisma/client"
import type { ProductDTO } from "../dtos/product.dto.js"

export function mapProductToDTO(product: Pick<Product, "id" | "name" | "price" | "categoryId"> & Partial<Pick<Product, "active">>): ProductDTO {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    categoryId: product.categoryId,
    active: product.active,
  }
}

