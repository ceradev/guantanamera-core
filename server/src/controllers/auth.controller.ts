import { Request, Response } from "express";
import {
    findUserByEmail,
    verifyPassword,
    generateToken,
    toUserResponse,
} from "../services/auth.service.js";
import { COOKIE_CONFIG } from "../config/cookie.config.js";
import { AuthenticatedRequest } from "../types/auth.types.js";
import { findUserById } from "../services/auth.service.js";

/**
 * Login controller
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            res.status(400).json({ error: "Email y contraseña son requeridos." });
            return;
        }

        // Find user
        const user = await findUserByEmail(email);

        if (!user) {
            res.status(401).json({ error: "Credenciales inválidas." });
            return;
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password);

        if (!isValid) {
            res.status(401).json({ error: "Credenciales inválidas." });
            return;
        }

        // Generate token
        const token = generateToken(user);

        // Set httpOnly cookie
        res.cookie(COOKIE_CONFIG.NAME, token, {
            ...COOKIE_CONFIG.OPTIONS,
            maxAge: COOKIE_CONFIG.MAX_AGE_MS,
        });

        // Return user info (without password)
        res.json({
            message: "Login exitoso.",
            user: toUserResponse(user),
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Error en el servidor." });
    }
}

/**
 * Logout controller
 * POST /api/auth/logout
 */
export async function logout(_req: Request, res: Response): Promise<void> {
    try {
        // Clear the auth cookie
        res.clearCookie(COOKIE_CONFIG.NAME, COOKIE_CONFIG.OPTIONS);

        res.json({ message: "Sesión cerrada correctamente." });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ error: "Error al cerrar sesión." });
    }
}

/**
 * Get current user controller
 * GET /api/auth/me (requires authentication)
 */
export async function me(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const user = await findUserById(req.user.userId);

        if (!user) {
            res.status(404).json({ error: "Usuario no encontrado." });
            return;
        }

        res.json({ user: toUserResponse(user) });
    } catch (error) {
        console.error("Me error:", error);
        res.status(500).json({ error: "Error en el servidor." });
    }
}
