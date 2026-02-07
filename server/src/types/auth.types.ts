import { Request } from "express";
import { Role } from "@prisma/client";

export interface JWTPayload {
    userId: string;
    email: string;
    role: Role;
    iat: number;
    exp: number;
}

export interface AuthenticatedRequest extends Request {
    user: JWTPayload;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface UserResponse {
    id: string;
    email: string;
    name: string;
    role: Role;
}
