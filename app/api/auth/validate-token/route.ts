import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Forward authorization header
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    // Forward request to the backend
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/api/auth/validate-token`, {
      method: 'GET',
      headers,
    });

    const data = await backendResponse.json();

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Error in auth validate-token API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 