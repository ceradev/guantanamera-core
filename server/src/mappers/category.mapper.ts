import type { Product } from "@prisma/client"
import type { CategoryDTO } from "../dtos/category.dto.js"
import { mapProductToDTO } from "./product.mapper.js"

export function mapCategoryWithProductsToDTO(category: { id: number; name: string; products: (Pick<Product, "id" | "name" | "price" | "categoryId"> & Partial<Pick<Product, "active">>)[] }): CategoryDTO {
  return {
    id: category.id,
    name: category.name,
    products: category.products.map(mapProductToDTO),
  }
}

export function mapCategorySummaryToDTO(category: { id: number; name: string; productCount: number }): CategoryDTO {
  return {
    id: category.id,
    name: category.name,
    productCount: category.productCount,
  }
}
