import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Disable performance tracing
  tracesSampleRate: 0,

  // Disable PII
  sendDefaultPii: false,

  // Only active in production
  enabled: process.env.NODE_ENV === "production",

  // Data Sanitization
  beforeSend(event) {
    if (event.request) {
      if (event.request.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }
      if (event.request.data) {
        event.request.data = '[Redacted]';
      }
    }
    return event;
  },
});
