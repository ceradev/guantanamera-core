import type { OrderItemDTO } from "../dtos/order-item.dto.js"

export function mapOrderItemToDTO(item: { productId: number; quantity: number; price: number; product?: { name: string }; name?: string }): OrderItemDTO {
  return {
    productId: item.productId,
    name: item.name ?? item.product?.name ?? "",
    quantity: item.quantity,
    price: item.price,
  }
}

