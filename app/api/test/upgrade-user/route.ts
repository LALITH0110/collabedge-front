import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, plan, stripeCustomerId, stripeSubscriptionId } = await request.json()

    if (!userId || !plan) {
      return NextResponse.json({ error: 'userId and plan are required' }, { status: 400 })
    }

    // Call backend API to update user subscription
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/api/user/subscription`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY || 'webhook'}`,
      },
      body: JSON.stringify({
        userId,
        plan,
        stripeCustomerId: stripeCustomerId || 'cus_test_manual',
        stripeSubscriptionId: stripeSubscriptionId || 'sub_test_manual',
        status: 'active',
        endsAt: null,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Backend API error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json({ success: true, result })
    
  } catch (error) {
    console.error('Error upgrading user:', error)
    return NextResponse.json(
      { error: 'Failed to upgrade user' },
      { status: 500 }
    )
  }
} 