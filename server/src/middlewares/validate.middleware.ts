import { ZodSchema } from "zod"
import { Request, Response, NextFunction } from "express"

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    })

    if (!result.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: result.error.flatten(),
      })
    }

    ;(req as any).validated = result.data
    next()
  }
}

