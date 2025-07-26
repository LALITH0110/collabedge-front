import { NextRequest, NextResponse } from 'next/server';
import { storeRoomPassword, getRoomPassword } from '@/lib/dev-storage';

export async function GET(request: NextRequest) {
  try {
    // Forward authorization header if present
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    // Proxy the request to the backend
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/api/rooms`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch rooms' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    
    // For development, return mock data if backend is unavailable
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json([]);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Create room request body:', body);
    
    // Always store the password in dev-storage if room is password protected
    // Do this before the backend call to ensure it's available even if the backend fails
    if (body.isPasswordProtected && body.password) {
      console.log(`Storing password for room ${body.roomKey} in dev-storage`);
      storeRoomPassword(body.roomKey, body.password);
      
      // Double-check that the password was stored
      const storedPassword = getRoomPassword(body.roomKey);
      if (storedPassword !== body.password) {
        console.error(`Failed to store password for room ${body.roomKey}! Expected "${body.password}" but got "${storedPassword}"`);
      }
    }
    
    // Forward authorization header if present
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    // Proxy the request to the backend
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/api/rooms`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to create room' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Store the password in dev-storage even when backend is available
    if (body.isPasswordProtected && body.password) {
      console.log(`Storing password for room ${data.roomKey || body.roomKey}`);
      storeRoomPassword(data.roomKey || body.roomKey, body.password);
    }
    
    // Ensure the response indicates password protection correctly
    if (body.isPasswordProtected) {
      data.isPasswordProtected = true;
      data.passwordProtected = true;
    }
    
    console.log('Room created successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating room:', error);
    
    // For development, return mock data if backend is unavailable
    if (process.env.NODE_ENV === 'development') {
      const body = await request.json();
      const roomKey = body.roomKey || generateRoomKey();
      const isPasswordProtected = body.isPasswordProtected === true;
      
      // Store the password in our dev-storage if room is password protected
      if (isPasswordProtected && body.password) {
        console.log(`Development mode: Creating password-protected room ${roomKey} with password "${body.password}"`);
        storeRoomPassword(roomKey, body.password);
        
        // Verify the password was stored
        const storedPassword = getRoomPassword(roomKey);
        console.log(`Development mode: Verified password for ${roomKey}: ${storedPassword === body.password ? 'Success' : 'Failed'}`);
      } else {
        console.log(`Development mode: Creating room ${roomKey} without password protection`);
      }
      
      console.log('Development mode - creating room with data:', {
        roomKey,
        name: body.name || `Room ${roomKey}`,
        isPasswordProtected: isPasswordProtected,
        hasPassword: isPasswordProtected && !!body.password
      });
      
      return NextResponse.json({
        id: roomKey.toLowerCase(),
        roomKey: roomKey,
        name: body.name || `Room ${roomKey}`,
        isPasswordProtected: isPasswordProtected,
        passwordProtected: isPasswordProtected, // Add this for compatibility with both field names
        createdAt: new Date().toISOString(),
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}

function generateRoomKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
} 