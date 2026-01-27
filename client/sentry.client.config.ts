import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Disable performance tracing
  tracesSampleRate: 0,

  // Disable session replays
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Disable PII
  sendDefaultPii: false,

  // Only active in production
  enabled: process.env.NODE_ENV === "production",

  // Data Sanitization
  beforeSend(event) {
    // Sanitize Request Data
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }
      
      // Redact body content completely to ensure no names/phones/orders are leaked
      if (event.request.data) {
        event.request.data = '[Redacted]';
      }
    }

    return event;
  },

  beforeBreadcrumb(breadcrumb) {
    // Filter out sensitive breadcrumbs
    if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
      if (breadcrumb.data && breadcrumb.data.url) {
        // Optional: Redact query parameters if needed
        // const url = new URL(breadcrumb.data.url);
        // url.search = '';
        // breadcrumb.data.url = url.toString();
      }
    }
    return breadcrumb;
  },
});
