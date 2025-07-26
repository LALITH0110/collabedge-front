import { NextRequest, NextResponse } from 'next/server';

/**
 * This API route forwards document operations to the backend
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string; documentId: string } }
) {
  const { roomId, documentId } = params;
  console.log(`Forwarding GET request for document ${documentId} in room ${roomId} to backend`);
  
  // Forward to backend
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
  const url = `${backendUrl}/api/rooms/${roomId}/documents/${documentId}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend returned status ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Retrieved document ${documentId} from backend for room ${roomId}`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error forwarding GET request to backend for document ${documentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to retrieve document from backend' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { roomId: string; documentId: string } }
) {
  const { roomId, documentId } = params;
  console.log(`Forwarding PUT request for document ${documentId} in room ${roomId} to backend`);
  
  try {
    const body = await request.json();
    console.log(`Document update content:`, body);
    
    // Forward to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const url = `${backendUrl}/api/rooms/${roomId}/documents/${documentId}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
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
    console.log(`Document ${documentId} updated in backend for room ${roomId}`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error forwarding PUT request to backend for document ${documentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to update document in backend' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { roomId: string; documentId: string } }
) {
  const { roomId, documentId } = params;
  console.log(`Forwarding DELETE request for document ${documentId} in room ${roomId} to backend`);
  
  // Forward to backend
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
  const url = `${backendUrl}/api/rooms/${roomId}/documents/${documentId}`;
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend returned error ${response.status}: ${errorText}`);
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }
    
    console.log(`Document ${documentId} deleted from backend for room ${roomId}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error forwarding DELETE request to backend for document ${documentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete document from backend' },
      { status: 500 }
    );
  }
} 