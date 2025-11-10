// Test comment to trigger recompilation
import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { Credentials } from 'google-auth-library';

const dbPath = path.join(process.cwd(), 'data', 'db.json');



interface Note {
  id: number;
  title: string;
  summary: string;
}

interface User {
  id: string | null | undefined;
  email: string | null | undefined;
  name: string | null | undefined;
  picture: string | null | undefined;
  tokens: Credentials;
  lastLogin: string;
}

interface Integration {
  name: string;
  userId: string | null | undefined;
  connected: boolean;
  tokens: Credentials;
}

interface DbData {
  integrations: Integration[];
  notes: Note[];
  users: User[];
}

async function readDb(): Promise<DbData> {
  try {
    await fs.access(dbPath, fs.constants.F_OK);
    const fileContent = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: unknown) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { integrations: [], notes: [], users: [] };
    }
    throw error;
  }
}

async function writeDb(data: DbData) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

export async function GET(request: Request) {
  const db: DbData = await readDb();
  
  // Get user ID from cookies
  const userId = request.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('user_id='))?.split('=')[1];
  
  if (!userId) {
    return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
  }

  // Find user in database
  const user: User | undefined = db.users?.find((u: User) => u.id === userId);
  
  if (!user || !user.tokens) {
    return NextResponse.json({ message: 'Google Meet not connected for this user' }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/auth/google/callback'
  );

  oauth2Client.setCredentials(user.tokens);

  // Add token refresh logic
  oauth2Client.on('tokens', async (tokens: Credentials) => {
    if (tokens.refresh_token) {
      // Store the new refresh_token in your database
      user.tokens.refresh_token = tokens.refresh_token;
    }
    // Update the access_token and expiry_date
    user.tokens.access_token = tokens.access_token;
    user.tokens.expiry_date = tokens.expiry_date;
    user.lastLogin = new Date().toISOString(); // Update last login
    await writeDb(db); // Save updated tokens to db.json
    console.log('Google tokens refreshed and saved.');
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
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
  } catch (error: unknown) {
    console.error('Error fetching Meet events:', error);
    return NextResponse.json({ 
      message: 'Error fetching Meet events', 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
