import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization code from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      // OAuth error occurred
      console.error('OAuth error:', error);
      return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
    }

    if (!code) {
      // No authorization code received
      console.error('No authorization code received');
      return NextResponse.redirect(new URL('/?error=no_code', request.url));
    }

    // Send the authorization code to the backend
    console.log('Sending authorization code to backend...');
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/api/auth/google/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    console.log('Backend response status:', backendResponse.status);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Failed to exchange code for tokens:', errorText);
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url));
    }

    const authData = await backendResponse.json();
    console.log('Received auth data from backend:', { 
      userId: authData.userId, 
      email: authData.email, 
      username: authData.username 
    });

    // Redirect to home page with success and token
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('auth_success', 'true');
    redirectUrl.searchParams.set('token', authData.token);
    redirectUrl.searchParams.set('email', authData.email);
    redirectUrl.searchParams.set('username', authData.username);
    redirectUrl.searchParams.set('userId', authData.userId);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(new URL('/?error=callback_failed', request.url));
  }
} 