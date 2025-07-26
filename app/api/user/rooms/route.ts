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
    } else {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Forward request to the backend
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/api/user/rooms`, {
      method: 'GET',
      headers,
    });

    const data = await backendResponse.json();

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Error in user rooms API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 