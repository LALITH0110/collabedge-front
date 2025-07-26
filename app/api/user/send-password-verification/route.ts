import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')

    if (!token) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/api/user/send-password-verification`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json(data, { status: response.status })
    } else {
      return NextResponse.json(data, { status: response.status })
    }
  } catch (error) {
    console.error('Error in send-password-verification proxy:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 