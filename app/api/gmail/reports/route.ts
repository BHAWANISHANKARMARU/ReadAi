import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findUserByGoogleId, upsertUser } from '@/lib/db';

export async function GET(request: Request) {
  const cookieStore = await cookies();
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
      // A new access token was received.
      // `tokens.refresh_token` will be undefined unless the user's session has
      // been revoked and they are re-authenticating.
      await upsertUser({
        googleId: user.google_id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || user.refresh_token, // Persist existing refresh token
      });
      console.log('Google tokens refreshed and saved.');
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
    });

    const messages = response.data.messages;
    if (!messages) {
      return NextResponse.json([]);
    }

    const gmailReports = await Promise.all(
      messages.map(async (message) => {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'metadata',
          metadataHeaders: ['Subject', 'Date', 'From'],
        });

        const subjectHeader = msg.data.payload?.headers?.find(
          (h) => h.name === 'Subject'
        );
        const dateHeader = msg.data.payload?.headers?.find(
          (h) => h.name === 'Date'
        );
        const fromHeader = msg.data.payload?.headers?.find(
          (h) => h.name === 'From'
        );

        const fromEmail = fromHeader?.value || 'Unknown Sender';
        const owner = fromEmail.includes('<')
          ? fromEmail.split('<')[0].trim()
          : fromEmail;

        return {
          id: msg.data.id,
          source: 'Gmail',
          title: subjectHeader?.value || 'No Subject',
          readScore: Math.floor(Math.random() * 100), // Dummy score
          tags: ['Email'],
          owner: owner,
          date: dateHeader?.value || new Date().toISOString(),
          snippet: msg.data.snippet || '',
        };
      })
    );

    return NextResponse.json(gmailReports);
  } catch (error) {
    console.error('Error fetching Gmail reports:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: 'Error fetching Gmail reports', error: errorMessage },
      { status: 500 }
    );
  }
}
