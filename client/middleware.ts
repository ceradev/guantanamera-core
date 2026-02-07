import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login']

// Static file patterns to ignore
const STATIC_PATTERNS = [
    '/_next',
    '/api',
    '/favicon',
    '/manifest',
    '/icons',
    '.png',
    '.jpg',
    '.ico',
    '.svg',
    '.webp',
]

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Skip static files and assets
    if (STATIC_PATTERNS.some(pattern => pathname.includes(pattern))) {
        return NextResponse.next()
    }

    // Allow public routes
    if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
        return NextResponse.next()
    }

    // Check for auth cookie
    const authToken = request.cookies.get('auth_token')

    if (!authToken) {
        // Redirect to login
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // User has cookie, allow access
    // Note: Actual token validation happens on the backend
    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)',
    ],
}
