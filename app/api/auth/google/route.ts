import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Redirect to the backend OAuth endpoint
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8080'}/oauth2/authorization/google`;
    return NextResponse.redirect(backendUrl);
  } catch (error) {
    console.error('Error initiating Google OAuth:', error);
    return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 });
  }
} 