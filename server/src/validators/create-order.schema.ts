import { z } from "zod"

const timeHHMM = z.string().refine((v) => {
  const m = /^(\d{2}):(\d{2})$/.exec(v)
  if (!m) return false
  const h = Number(m[1])
  const min = Number(m[2])
  return h >= 0 && h <= 23 && min >= 0 && min <= 59
}, { message: "Invalid pickup time" })

export const createOrderSchema = z.object({
  body: z.object({
    customerName: z.string().min(1, "Customer name is required").max(50),
    customerPhone: z.string().min(7).max(20).optional(),
    pickupTime: timeHHMM,
    items: z.array(
      z.object({
        name: z.string().min(1).max(100),
        quantity: z.number().int().positive().max(20),
      })
    ).min(1, "Order must contain at least one item"),
  }),
})
