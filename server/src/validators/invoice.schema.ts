import { z } from "zod"

const invoiceItemSchema = z.object({
  description: z.string().min(1, "La descripción es requerida"),
  quantity: z.number().int().positive("La cantidad debe ser mayor a 0"),
  unitPrice: z.number().positive("El precio unitario debe ser mayor a 0"),
})

export const createInvoiceSchema = z.object({
  body: z.object({
    date: z.string().transform((val) => new Date(val)),
    supplier: z.string().min(1, "El proveedor es requerido"),
    reference: z.string().optional(),
    category: z.enum(["FOOD", "DRINKS", "SUPPLIES", "RENT", "UTILITIES", "MAINTENANCE", "OTHER"]),
    notes: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1, "Se requiere al menos un item"),
  }),
})

export const invoiceQuerySchema = z.object({
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    category: z.enum(["FOOD", "DRINKS", "SUPPLIES", "RENT", "UTILITIES", "MAINTENANCE", "OTHER"]).optional(),
  }),
})

export const invoiceIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de factura inválido"),
  }),
})
