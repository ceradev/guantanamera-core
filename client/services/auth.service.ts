import { fetchAPI } from '@/lib/api'

export interface User {
    id: string
    email: string
    name: string
    role: 'ADMIN' | 'EMPLOYEE'
}

export interface LoginResponse {
    message: string
    user: User
}

export interface AuthError {
    error: string
}

/**
 * Login with email and password
 * Sets httpOnly cookie on success
 */
export async function login(email: string, password: string): Promise<User> {
    const response = await fetchAPI<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    })
    return response.user
}

/**
 * Logout current user
 * Clears the auth cookie
 */
export async function logout(): Promise<void> {
    await fetchAPI<{ message: string }>('/api/auth/logout', {
        method: 'POST',
    })
}

/**
 * Get current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
    try {
        const response = await fetchAPI<{ user: User }>('/api/auth/me')
        return response.user
    } catch {
        return null
    }
}
