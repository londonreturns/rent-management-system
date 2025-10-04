import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromRequest } from '@/lib/jwt';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip authentication for the main page and API auth routes
    if (pathname === '/' || pathname.startsWith('/api/auth/')) {
        return NextResponse.next();
    }

    // Extract token from request
    const token = extractTokenFromRequest(request);

    if (!token) {
        // Redirect to login page if no token
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Verify token
    const payload = await verifyToken(token);

    if (!payload || !payload.authenticated) {
        // Redirect to login page if token is invalid
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Add user info to headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-authenticated', 'true');

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (authentication routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    ],
};
