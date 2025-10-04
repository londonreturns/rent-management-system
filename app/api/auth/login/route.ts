import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
    try {
        const { pin } = await request.json();

        const apiKey = process.env.NEXT_PUBLIC_API_KEY;

        if (pin !== apiKey) {
            return NextResponse.json(
                { message: 'Invalid PIN' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = await generateToken({
            userId: 'admin',
            authenticated: true
        });

        // Create response with token
        const response = NextResponse.json(
            {
                message: 'Authentication successful',
                token,
                authenticated: true
            },
            { status: 200 }
        );

        // Set token as HTTP-only cookie
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 // 24 hours
        });

        return response;
    } catch (error) {
        console.error('Authentication error:', error);
        return NextResponse.json(
            { message: 'Authentication failed' },
            { status: 500 }
        );
    }
}
