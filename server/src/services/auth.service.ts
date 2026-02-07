import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, Role } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { env } from "../config/env.js";
import { COOKIE_CONFIG, JWT_CONFIG } from "../config/cookie.config.js";
import { JWTPayload, UserResponse } from "../types/auth.types.js";

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: User): string {
    const payload: Omit<JWTPayload, "iat" | "exp"> = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    return jwt.sign(payload, JWT_CONFIG.SECRET, {
        expiresIn: JWT_CONFIG.EXPIRES_IN,
    });
}

/**
 * Verify and decode a JWT token
 * Returns null if token is invalid or expired
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_CONFIG.SECRET) as JWTPayload;
    } catch {
        return null;
    }
}

/**
 * Check if a token should be renewed (less than 7 days remaining)
 */
export function shouldRenewToken(payload: JWTPayload): boolean {
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = payload.exp - now;
    return timeRemaining < COOKIE_CONFIG.RENEWAL_THRESHOLD_SECONDS;
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
        where: { email, active: true },
    });
}

/**
 * Find user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
        where: { id, active: true },
    });
}

/**
 * Map User to safe response (without password)
 */
export function toUserResponse(user: User): UserResponse {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    };
}

/**
 * Create a new user (for seeding/admin purposes)
 */
export async function createUser(data: {
    email: string;
    password: string;
    name: string;
    role?: Role;
}): Promise<User> {
    const hashedPassword = await hashPassword(data.password);
    return prisma.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            name: data.name,
            role: data.role || "EMPLOYEE",
        },
    });
}
