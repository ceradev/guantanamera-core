import { z } from "zod"

export const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
    status: z.enum(["RECEIVED","PREPARING","READY","DELIVERED","CANCELLED"]).optional(),
  }),
})

