import { z } from "zod"

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    price: z.number().positive(),
    categoryId: z.number().int().positive(),
  }),
})

export const updateProductSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    price: z.number().positive().optional(),
    active: z.boolean().optional(),
    categoryId: z.number().int().positive().optional(),
  }),
})

export const productActiveSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    active: z.boolean(),
  }),
})
