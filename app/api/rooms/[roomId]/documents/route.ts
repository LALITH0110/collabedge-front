import { NextRequest, NextResponse } from 'next/server';

/**
 * This API route forwards all document requests to the backend
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const roomId = params.roomId;
  console.log(`Forwarding GET request for documents in room ${roomId} to backend`);
  
  // Forward to backend
  const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8080'}/api/rooms/${roomId}/documents`;
  
  // Forward authorization header if present
  const authHeader = request.headers.get('authorization');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (authHeader) {
    headers.Authorization = authHeader;
  }

  try {
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log(`Retrieved ${data.length} documents from backend for room ${roomId}`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error forwarding GET request to backend for room ${roomId}:`, error);
    return NextResponse.json(
      { error: 'Failed to retrieve documents from backend' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const roomId = params.roomId;
  console.log(`Forwarding POST request for document creation in room ${roomId} to backend`);
  
  try {
    const body = await request.json();
    
    // Forward to backend
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8080'}/api/rooms/${roomId}/documents`;
    
    // Forward authorization header if present
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend returned error ${response.status}: ${errorText}`);
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Document created in backend for room ${roomId} with ID ${data.id}`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error forwarding POST request to backend for room ${roomId}:`, error);
    return NextResponse.json(
      { error: 'Failed to create document in backend' },
      { status: 500 }
    );
  }
} 