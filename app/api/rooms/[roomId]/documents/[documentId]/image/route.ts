import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string; documentId: string } }
) {
  const { roomId, documentId } = params;
  console.log(`Forwarding GET image request for document ${documentId} in room ${roomId} to backend`);
  
  // Forward to backend
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
  const url = `${backendUrl}/api/rooms/${roomId}/documents/${documentId}/image`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend returned status ${response.status}` },
        { status: response.status }
      );
    }
    
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    
    console.log(`Retrieved image for document ${documentId} from backend for room ${roomId}`);
    
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error(`Error forwarding GET image request to backend for document ${documentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to retrieve image from backend' },
      { status: 500 }
    );
  }
} 