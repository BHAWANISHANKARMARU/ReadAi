import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findUserByGoogleId, upsertUser } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { docId: string } }
) {
  const cookieStore = cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
  }

  try {
    const user = await findUserByGoogleId(userId);

    if (!user || !user.access_token) {
      return NextResponse.json(
        { message: 'Google account not connected or token missing' },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
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

    oauth2Client.setCredentials({
      access_token: user.access_token,
      refresh_token: user.refresh_token,
    });

    // Listen for token refresh events
    oauth2Client.on('tokens', async (tokens) => {
      await upsertUser({
        googleId: user.google_id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || user.refresh_token,
      });
      console.log('Google tokens refreshed and saved for Docs.');
    });

    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    const response = await docs.documents.get({
      documentId: params.docId,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching document:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: 'Error fetching document', error: errorMessage },
      { status: 500 }
    );
  }
}
