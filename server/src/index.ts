// index.js
import app from "./app.js"
import { logger } from "./utils/logger.js"
import { env } from "./config/env.js";

const PORT = env.PORT || 8000

app.listen(PORT, () => {
  logger.info(`Guantanamera Core API running on port ${PORT} [${env.NODE_ENV || 'development'}]`)
})