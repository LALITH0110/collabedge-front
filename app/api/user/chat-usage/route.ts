import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')

    if (!token) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/api/user/chat-usage`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json(data, { status: response.status })
    } else {
      return NextResponse.json(data, { status: response.status })
    }
  } catch (error) {
    console.error('Error in chat-usage proxy:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 