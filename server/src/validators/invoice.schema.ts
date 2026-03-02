import { z } from "zod"

const invoiceItemSchema = z.object({
  description: z.string().min(1, "La descripción es requerida"),
  quantity: z.number().int().positive("La cantidad debe ser mayor a 0"),
  unitPrice: z.number().refine((val) => val !== 0, "El precio unitario no puede ser 0"),
  taxRate: z.number().min(0).max(100).optional().default(0),
})

export const createInvoiceSchema = z.object({
  body: z.object({
    date: z.string().transform((val) => new Date(val)),
    supplierId: z.string().uuid("ID de proveedor inválido"),
    reference: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1, "Se requiere al menos un item"),
  }),
})

export const invoiceQuerySchema = z.object({
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    supplierIds: z.union([z.string(), z.array(z.string())]).optional(),
  }),
})

export const invoiceIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de factura inválido"),
  }),
})
