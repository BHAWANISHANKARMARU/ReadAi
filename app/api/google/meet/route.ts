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
      await upsertUser({
        googleId: user.google_id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || user.refresh_token,
      });
      console.log('Google tokens refreshed and saved for Meet.');
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Fetch calendar events with Google Meet links
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    // Filter events that have Google Meet conference data
    const meetEvents = events
      .filter(event => event.conferenceData?.conferenceSolution?.name === 'Google Meet')
      .map(event => ({
        id: event.id,
        name: event.summary || 'Untitled Meeting',
        startTime: event.start?.dateTime || event.start?.date,
        endTime: event.end?.dateTime || event.end?.date,
        meetingCode: event.conferenceData?.conferenceId,
        meetingUrl: event.hangoutLink || event.conferenceData?.entryPoints?.find(ep => ep?.entryPointType === 'video')?.uri,
        attendees: event.attendees || [],
        description: event.description || '',
        space: {
          meetingCode: event.conferenceData?.conferenceId,
        }
      }));

    return NextResponse.json(meetEvents);
  } catch (error) {
    console.error('Error fetching Meet events:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: 'Error fetching Meet events', error: errorMessage },
      { status: 500 }
    );
  }
}
