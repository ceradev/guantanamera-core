// src/app.js
import express from "express"
import Sentry from "./config/sentry.js"
import productRoutes from "./routes/product.routes.js"
import orderRoutes from "./routes/order.routes.js"
import categoryRoutes from "./routes/category.routes.js"
import healthRoutes from "./routes/health.routes.js"
import salesRoutes from "./routes/sales.routes.js"
import notificationRoutes from "./routes/notification.routes.js"
import settingRoutes from "./routes/setting.routes.js"
import swaggerUi from "swagger-ui-express"
import { swaggerSpec } from "./config/swagger.js"
import { corsMiddleware } from "./config/cors.js";
import { requestLogger } from "./middlewares/request-logger.js"
import { errorHandler } from "./middlewares/error.middleware.js"
import helmet from "helmet"


const app = express()

app.set('trust proxy', 1)

app.use(corsMiddleware)

app.use(helmet())

app.use(requestLogger)

app.use(express.json())

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use(productRoutes)
app.use(orderRoutes)
app.use(categoryRoutes)
app.use(healthRoutes)
app.use(salesRoutes)
app.use(notificationRoutes)
app.use(settingRoutes)

// Sentry Error Handler must be before any other error middleware
app.use(Sentry.expressErrorHandler({
    shouldHandleError(error: any) {
        // Capture all 500 errors and unknown errors (crashes, Prisma errors)
        if (!error.status && !error.statusCode) return true;
        const status = error.status || error.statusCode;
        return status >= 500;
    }
}));

app.use(errorHandler)

export default app
