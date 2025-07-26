import { NextRequest, NextResponse } from 'next/server';
import { storeRoomPassword, roomHasPassword, getRoomPassword } from '@/lib/dev-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { roomKey: string } }
) {
  try {
    const roomKey = params.roomKey;
    const searchParams = request.nextUrl.searchParams;
    const password = searchParams.get('password');
    
    if (!roomKey) {
      return NextResponse.json(
        { error: 'Room key is required' },
        { status: 400 }
      );
    }
    
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required as a query parameter' },
        { status: 400 }
      );
    }
    
    // Store the password
    storeRoomPassword(roomKey, password);
    
    // Verify the password was stored correctly
    const hasPassword = roomHasPassword(roomKey);
    const storedPassword = getRoomPassword(roomKey);
    
    return NextResponse.json({
      success: true,
      roomKey,
      hasPassword,
      passwordMatches: storedPassword === password,
      message: `Password for room ${roomKey} has been stored successfully`
    });
  } catch (error) {
    console.error('Error adding password:', error);
    return NextResponse.json(
      { error: 'Failed to add password' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { roomKey: string } }
) {
  try {
    const roomKey = params.roomKey;
    const body = await request.json();
    const password = body.password;
    
    if (!roomKey) {
      return NextResponse.json(
        { error: 'Room key is required' },
        { status: 400 }
      );
    }
    
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required in the request body' },
        { status: 400 }
      );
    }
    
    // Store the password
    storeRoomPassword(roomKey, password);
    
    // Verify the password was stored correctly
    const hasPassword = roomHasPassword(roomKey);
    const storedPassword = getRoomPassword(roomKey);
    
    return NextResponse.json({
      success: true,
      roomKey,
      hasPassword,
      passwordMatches: storedPassword === password,
      message: `Password for room ${roomKey} has been stored successfully`
    });
  } catch (error) {
    console.error('Error adding password:', error);
    return NextResponse.json(
      { error: 'Failed to add password' },
      { status: 500 }
    );
  }
} 