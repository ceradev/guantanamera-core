import { z } from "zod"

export const salesQuerySchema = z.object({
  query: z.object({
    type: z.enum(["day","week","month"]),
    date: z.string().optional(),
    source: z.enum(["ORDER", "MANUAL"]).optional(),
  })
})

