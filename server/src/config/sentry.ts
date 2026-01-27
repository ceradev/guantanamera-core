import * as Sentry from "@sentry/node";
import { env } from "./env.js";

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: env.NODE_ENV,
  tracesSampleRate: 0, // Disable performance tracing as requested
  sendDefaultPii: false, // Ensure no PII is sent by default
  integrations: [
    // Prisma integration is often auto-detected with @sentry/node, 
    // but we can explicitly enable it if needed. 
    // For now, we rely on default integrations.
    Sentry.prismaIntegration(),
  ],
  beforeSend(event) {
    // Scrub sensitive data from the event
    if (event.request) {
      // Scrub headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['x-api-key'];
        delete event.request.headers['cookie'];
      }

      // Scrub body/data - strictly redacting as requested
      // "No enviar payloads completos, nombres, teléfonos, datos de pedidos"
      if (event.request.data) {
        // We replace the entire body to be safe, or we could parse and sanitize.
        // Given the strict requirement "No enviar payloads completos", replacing with message is safest.
        event.request.data = "[Redacted Body]";
      }
      
      // Scrub query params if needed
      // event.request.query_string could contain sensitive info?
      // Usually query params are less sensitive but "customerPhone" might be there?
      // Let's leave query params but be aware. 
      // User said "Sanitizar req.query".
      if (event.request.query_string) {
         // It's hard to parse query_string reliably here without a library, 
         // but Sentry usually provides it as an object or string.
         // If it's an object (in some contexts), we can scrub.
         // If it's a string, we might just redact it if we are paranoid.
         // Let's assume standard behavior: Sentry captures it. 
         // We will leave it for now or set to null if strict.
         // "Sanitizar req.query" -> Let's redact it to be safe.
         event.request.query_string = "[Redacted Query]";
      }
    }

    // Remove user info if any
    if (event.user) {
      delete event.user.ip_address;
      delete event.user.email;
      delete event.user.id;
      delete event.user.username;
    }

    return event;
  },
});

export default Sentry;
