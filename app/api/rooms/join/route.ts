import { NextRequest, NextResponse } from 'next/server';

// This API route should delegate to the backend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Join room request body:', body);

    // Forward authorization header if present
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    // Forward request to the backend
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/api/rooms/join`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to join room' }, 
        { status: backendResponse.status }
      );
    }

    const room = await backendResponse.json();
    return NextResponse.json(room, { status: 200 });
  } catch (error) {
    console.error('Error in room join API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 