import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { upsertUser } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return NextResponse.json({ message: 'Code not found' }, { status: 400 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      `${url.protocol}//${url.host}`;
    const normalizedBase = baseUrl.replace(/\/$/, '');

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${normalizedBase}/api/auth/google/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    if (!userInfo.data.id || !userInfo.data.email || !userInfo.data.name || !userInfo.data.picture) {
        throw new Error("Failed to retrieve complete user information from Google.");
    }

    // Save user and tokens to the database
    const user = await upsertUser({
      googleId: userInfo.data.id,
      email: userInfo.data.email,
      name: userInfo.data.name,
      picture: userInfo.data.picture,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token ?? undefined,
    });

    // Create response and set cookies
    const response = NextResponse.redirect(`${normalizedBase}/integrations`);
    response.cookies.set('user_id', user.google_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    response.cookies.set('user_email', user.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Error during Google OAuth callback:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: 'Authentication failed', error: errorMessage },
      { status: 500 }
    );
  }
}
