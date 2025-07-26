import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { roomKey, password } = await request.json()
    
    if (!roomKey || !password) {
      return NextResponse.json(
        { error: 'Room key and password are required' },
        { status: 400 }
      )
    }
    
    // Get existing passwords from localStorage
    let existingPasswords: { [key: string]: string } = {}
    try {
      const stored = localStorage.getItem('dev_room_passwords')
      if (stored) {
        existingPasswords = JSON.parse(stored)
      }
    } catch (error) {
      console.log('No existing passwords found')
    }
    
    // Add the new password
    existingPasswords[roomKey.toUpperCase()] = password
    
    // Store back in localStorage
    localStorage.setItem('dev_room_passwords', JSON.stringify(existingPasswords))
    
    console.log(`Added password for room ${roomKey}: ${password}`)
    
    return NextResponse.json({
      success: true,
      message: `Password added for room ${roomKey}`,
      totalPasswords: Object.keys(existingPasswords).length
    })
    
  } catch (error) {
    console.error('Error adding room password:', error)
    return NextResponse.json(
      { error: 'Failed to add password' },
      { status: 500 }
    )
  }
} 