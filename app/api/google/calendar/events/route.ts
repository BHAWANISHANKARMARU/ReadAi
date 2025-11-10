// Test comment to trigger recompilation
import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'db.json');

async function readDb() {
  try {
    await fs.access(dbPath, fs.constants.F_OK); // Check if file exists
    const fileContent = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    if (error.code === 'ENOENT') { // File not found
      return { integrations: [], notes: [] }; // Return default empty structure with notes array
    }
    throw error; // Re-throw other errors
  }
}

async function writeDb(data: any) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

export async function GET(request: Request) {
  const db = await readDb();
  
  // Get user ID from cookies
  const userId = request.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('user_id='))?.split('=')[1];
  
  if (!userId) {
    return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
  }

  // Find user in database
  const user = db.users?.find((u: any) => u.id === userId);
  
  if (!user || !user.tokens) {
    return NextResponse.json({ message: 'Google Calendar not connected for this user' }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/auth/google/callback'
  );

  oauth2Client.setCredentials(user.tokens);

  // Add token refresh logic
  oauth2Client.on('tokens', async (tokens) => {
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
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ message: 'Error fetching calendar events' }, { status: 500 });
  }
}
