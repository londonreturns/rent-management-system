import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromRequest } from '@/lib/jwt';

export async function GET(request: NextRequest) {
    try {
        const token = extractTokenFromRequest(request);

        if (!token) {
            return NextResponse.json(
                { authenticated: false },
                { status: 401 }
            );
        }

        const payload = await verifyToken(token);

        if (!payload || !payload.authenticated) {
            return NextResponse.json(
                { authenticated: false },
                { status: 401 }
            );
        }

        return NextResponse.json({
            authenticated: true,
            userId: payload.userId
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return NextResponse.json(
            { authenticated: false },
            { status: 401 }
        );
    }
}
