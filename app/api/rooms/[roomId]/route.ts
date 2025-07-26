import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const roomId = params.roomId;
  console.log(`Forwarding GET request for room ${roomId} to backend`);
  
  try {
    // Forward authorization header if present
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    // Forward to backend
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8080'}/api/rooms/${roomId}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
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
    console.log(`Room data retrieved from backend for room ${roomId}`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error forwarding GET request to backend for room ${roomId}:`, error);
    return NextResponse.json(
      { error: 'Failed to get room from backend' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const roomId = params.roomId;
  console.log(`Forwarding DELETE request for room ${roomId} to backend`);
  
  try {
    // Forward authorization header if present
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    // Forward to backend
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8080'}/api/rooms/${roomId}`;
    
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend returned error ${response.status}: ${errorText}`);
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }
    
    console.log(`Room ${roomId} deleted successfully in backend`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error forwarding DELETE request to backend for room ${roomId}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete room in backend' },
      { status: 500 }
    );
  }
} 