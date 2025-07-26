import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomKey: string }> }
) {
  try {
    const { roomKey } = await params;

    // Forward authorization header (required for this endpoint)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    };

    // Forward request to the backend
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/api/rooms/access/${roomKey}`, {
      method: 'GET',
      headers,
    });

    const data = await backendResponse.json();

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Error in room access API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 