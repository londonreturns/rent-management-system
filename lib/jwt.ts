const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export interface JWTPayload {
    userId: string;
    authenticated: boolean;
    iat?: number;
    exp?: number;
}

// Simple base64 URL encoding/decoding
function base64UrlEncode(str: string): string {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
        str += '=';
    }
    return atob(str);
}

// Simple hash function using Web Crypto API
async function simpleHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (24 * 60 * 60); // 24 hours from now

    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    const payloadWithExp = {
        ...payload,
        iat: now,
        exp: exp
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payloadWithExp));

    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = await simpleHash(data + JWT_SECRET);

    return `${data}.${signature}`;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        const [encodedHeader, encodedPayload, signature] = parts;

        // Verify signature
        const data = `${encodedHeader}.${encodedPayload}`;
        const expectedSignature = await simpleHash(data + JWT_SECRET);

        if (signature !== expectedSignature) {
            return null;
        }

        // Decode payload
        const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;

        // Check expiration
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return payload;
    } catch (error) {
        console.error('JWT verification failed:', error);
        return null;
    }
}

export function extractTokenFromRequest(request: Request): string | null {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Also check cookies as fallback
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {} as Record<string, string>);

        return cookies['auth-token'] || null;
    }

    return null;
}
