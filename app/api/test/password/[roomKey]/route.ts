import { NextRequest, NextResponse } from 'next/server';
import { roomHasPassword, getRoomPassword, getAllRoomKeys } from '@/lib/dev-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { roomKey: string } }
) {
  const roomKey = params.roomKey;
  console.log(`Testing password for room ${roomKey}`);
  
  // Only available in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Test routes only available in development mode' },
      { status: 403 }
    );
  }
  
  const hasPassword = roomHasPassword(roomKey);
  const password = hasPassword ? getRoomPassword(roomKey) : undefined;
  const allRoomKeys = getAllRoomKeys();
  
  console.log(`Test results for room ${roomKey}:`);
  console.log(`- Has password: ${hasPassword}`);
  console.log(`- Password: ${password || 'none'}`);
  console.log(`- All room keys: ${allRoomKeys.join(', ') || 'none'}`);
  
  return NextResponse.json({
    roomKey,
    hasPassword,
    password: password || null,
    allRoomKeys,
    timestamp: new Date().toISOString(),
    normalizedKey: roomKey.toUpperCase()
  });
} 