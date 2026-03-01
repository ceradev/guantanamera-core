import type { JWTPayload } from "./auth.types.js"

declare global {
  namespace Express {
    interface Request {
      validated?: {
        body?: any
        params?: any
        query?: any
      }
      user?: JWTPayload
    }
  }
}

export {}
