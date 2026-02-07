import { Response, NextFunction } from "express";
import { AuthenticatedRequest, JWTPayload } from "../types/auth.types.js";
import {
    verifyToken,
    shouldRenewToken,
    generateToken,
    findUserById,
} from "../services/auth.service.js";
import { COOKIE_CONFIG } from "../config/cookie.config.js";

/**
 * Authentication middleware with sliding session renewal
 *
 * 1. Extracts JWT from httpOnly cookie
 * 2. Verifies token validity
 * 3. Renews token if less than 7 days remaining (sliding session)
 * 4. Attaches user payload to request
 */
export async function requireAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Extract token from cookie
        const token = req.cookies?.[COOKIE_CONFIG.NAME];

        if (!token) {
            res.status(401).json({ error: "No autorizado. Inicia sesión." });
            return;
        }

        // Verify token
        const payload = verifyToken(token);

        if (!payload) {
            // Clear invalid cookie
            res.clearCookie(COOKIE_CONFIG.NAME, COOKIE_CONFIG.OPTIONS);
            res.status(401).json({ error: "Sesión expirada. Inicia sesión de nuevo." });
            return;
        }

        // Verify user still exists and is active
        const user = await findUserById(payload.userId);

        if (!user) {
            res.clearCookie(COOKIE_CONFIG.NAME, COOKIE_CONFIG.OPTIONS);
            res.status(401).json({ error: "Usuario no válido." });
            return;
        }

        // Sliding session: renew token if less than 7 days remaining
        if (shouldRenewToken(payload)) {
            const newToken = generateToken(user);

            res.cookie(COOKIE_CONFIG.NAME, newToken, {
                ...COOKIE_CONFIG.OPTIONS,
                maxAge: COOKIE_CONFIG.MAX_AGE_MS,
            });
        }

        // Attach user to request
        req.user = payload;

        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.status(500).json({ error: "Error de autenticación." });
    }
}

/**
 * Optional auth middleware - doesn't require authentication but attaches user if present
 */
export async function optionalAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const token = req.cookies?.[COOKIE_CONFIG.NAME];

        if (token) {
            const payload = verifyToken(token);
            if (payload) {
                req.user = payload;
            }
        }

        next();
    } catch {
        // Continue without user
        next();
    }
}
