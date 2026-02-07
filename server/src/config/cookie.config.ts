import { env } from "./env.js";

// Cookie configuration for sliding session authentication
export const COOKIE_CONFIG = {
    // Cookie name
    NAME: "auth_token",

    // 30 days in milliseconds (for cookie maxAge)
    MAX_AGE_MS: 30 * 24 * 60 * 60 * 1000,

    // 30 days in seconds (for JWT expiration)
    MAX_AGE_SECONDS: 30 * 24 * 60 * 60,

    // Renewal threshold: 7 days in seconds
    // If token expires in less than this, renew it
    RENEWAL_THRESHOLD_SECONDS: 7 * 24 * 60 * 60,

    // Cookie options
    OPTIONS: {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax" as const,
        domain: env.NODE_ENV === "production" ? ".barguantanamera.com" : undefined,
        path: "/",
    },
} as const;

// JWT configuration
export const JWT_CONFIG = {
    SECRET: env.JWT_SECRET,
    EXPIRES_IN: `${COOKIE_CONFIG.MAX_AGE_SECONDS}s`,
} as const;
