import cors from "cors";

const allowedOrigins = [
  "https://barguantanamera.com",
  "https://www.barguantanamera.com",
  "https://api.barguantanamera.com",
  "https://dashboard.barguantanamera.com",

  // desarrollo
  "http://localhost:3000",
  "http://localhost:8000",
];

export const corsMiddleware = cors({
  origin(origin, callback) {
    // Permitir requests sin origin (curl, swagger interno)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || (origin && (origin.endsWith(".barguantanamera.com") || origin === "https://barguantanamera.com"))) {
      return callback(null, true);
    }

    console.warn(`CORS attempt from unauthorized origin: ${origin}`);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "x-api-key", 
    "Accept", 
    "Origin", 
    "X-Requested-With",
    "Access-Control-Allow-Origin"
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
});
