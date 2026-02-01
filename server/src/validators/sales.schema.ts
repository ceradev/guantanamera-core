import { z } from "zod"

export const salesQuerySchema = z.object({
  query: z.object({
    type: z.enum(["day","week","month","custom"]),
    date: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    source: z.enum(["ORDER", "MANUAL"]).optional(),
  })
})

