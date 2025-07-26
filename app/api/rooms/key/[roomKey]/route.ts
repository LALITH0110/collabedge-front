import { NextRequest, NextResponse } from 'next/server';
import { roomHasPassword, getRoomDocuments, getRoomState, generateConsistentId } from '@/lib/dev-storage';

// This API route should delegate to the backend
export async function GET(
  request: NextRequest,
  { params }: { params: { roomKey: string } }
) {
  try {
    const roomKey = params.roomKey;
    console.log(`Checking room key: ${roomKey}`);

    // Forward authorization header if present
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    // Forward request to the backend
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/api/rooms/key/${roomKey}`, {
      method: 'GET',
      headers,
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json(
        { error: errorData.error || `Room with key "${roomKey}" not found` }, 
        { status: backendResponse.status }
      );
    }

    const room = await backendResponse.json();
    return NextResponse.json(room, { status: 200 });
  } catch (error) {
    console.error(`Error checking room ${params.roomKey}:`, error);
    return NextResponse.json({ error: 'Failed to check room' }, { status: 500 });
  }
} 