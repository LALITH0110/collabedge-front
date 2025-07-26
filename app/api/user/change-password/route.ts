import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = request.headers.get('authorization')

    if (!token) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    // Remove currentPassword from the request body since backend doesn't need it anymore
    const { currentPassword, ...requestBody } = body

    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/api/user/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json(data, { status: response.status })
    } else {
      return NextResponse.json(data, { status: response.status })
    }
  } catch (error) {
    console.error('Error in change-password proxy:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 