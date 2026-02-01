import { fetchAPI } from '@/lib/api'
import type { Category, Product } from '@/types'

/**
 * Obtiene el menú público agrupado por categorías.
 * @returns Lista de categorías con productos activos.
 */
export async function getPublicMenu(): Promise<Category[]> {
  return fetchAPI<Category[]>('/products', {}, true)
}

/**
 * Alias de compatibilidad para obtener el menú público.
 * @returns Lista de categorías con productos activos.
 */
export async function getCategories(): Promise<Category[]> {
  return getPublicMenu()
}

/**
 * Obtiene el menú completo para administración.
 * @returns Lista de categorías con todos los productos.
 */
export async function getAdminMenu(): Promise<Category[]> {
  return fetchAPI<Category[]>('/products/all', {}, true)
}

/**
 * Obtiene solo los nombres de productos inactivos (público).
 * @returns Lista de nombres de productos inactivos.
 */
export async function getInactiveProductNames(): Promise<string[]> {
  return fetchAPI<string[]>('/products/inactive-names')
}

/**
 * Crea una nueva categoría.
 * @param name Nombre de la categoría.
 * @returns Categoría creada.
 */
export async function createCategory(name: string): Promise<Category> {
  return fetchAPI<Category>('/categories', { method: 'POST', body: JSON.stringify({ name }) }, true)
}

/**
 * Crea un nuevo producto.
 * @param data Datos del producto.
 * @returns Producto creado.
 */
export async function createProduct(data: { name: string; price: number; categoryId: number }): Promise<Product> {
  return fetchAPI<Product>('/products', { method: 'POST', body: JSON.stringify(data) }, true)
}

/**
 * Actualiza un producto existente.
 * @param id ID del producto.
 * @param data Campos a actualizar.
 * @returns Producto actualizado.
 */
export async function updateProduct(
  id: number,
  data: { name?: string; price?: number; active?: boolean; categoryId?: number }
): Promise<Product> {
  return fetchAPI<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, true)
}

/**
 * Activa o desactiva un producto.
 * @param id ID del producto.
 * @param active Estado a establecer.
 * @returns Producto actualizado.
 */
export async function updateProductActive(id: number, active: boolean): Promise<Product> {
  return fetchAPI<Product>(`/products/${id}/active`, { method: 'PATCH', body: JSON.stringify({ active }) }, true)
}

/**
 * Elimina un producto.
 * @param id ID del producto.
 */
export async function deleteProduct(id: number): Promise<void> {
  return fetchAPI<void>(`/products/${id}`, { method: 'DELETE' }, true)
}

/**
 * Obtiene lista plana de todos los productos (para selects/admin).
 */
export async function getProducts(): Promise<Product[]> {
  const categories = await getAdminMenu()
  return categories.flatMap(c => c.products || [])
}
