import rateLimit from "express-rate-limit"

export const orderRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many orders. Please wait a moment before trying again.",
  },
})
