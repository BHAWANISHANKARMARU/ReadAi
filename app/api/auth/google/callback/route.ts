import { google, Auth } from 'googleapis';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Support serverless (Vercel) by writing to /tmp
const baseDir = process.env.VERCEL ? '/tmp' : process.cwd();
const dataDir = path.join(baseDir, 'data');
const dbPath = path.join(dataDir, 'db.json');

interface User {
  id: string | null | undefined;
  email: string | null | undefined;
  name: string | null | undefined;
  picture: string | null | undefined;
  tokens: Auth.Credentials;
  lastLogin: string;
}

interface Integration {
  name: string;
  userId: string | null | undefined;
  connected: boolean;
  tokens: Auth.Credentials;
}

interface Note {
  id: number;
  title: string;
  summary: string;
}

interface DbData {
  integrations: Integration[];
  notes: Note[];
  users: User[];
}

async function readDb(): Promise<DbData> {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.access(dbPath, fs.constants.F_OK); // Check if file exists
    const fileContent = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: unknown) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') { // File not found
      return { integrations: [], notes: [], users: [] }; // Return default empty structure with notes array
    }
    throw error; // Re-throw other errors
  }
}

async function writeDb(data: DbData) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      `${url.protocol}//${url.host}`;
    const normalizedBase = baseUrl.replace(/\/$/, '');
    const code = url.searchParams.get('code');

    if (!code) {
      return NextResponse.json({ message: 'Code not found' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${normalizedBase}/api/auth/google/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user information
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    console.log('Tokens:', tokens);
    console.log('User Info:', userInfo.data);

    const db: DbData = await readDb();

    // Initialize users array if it doesn't exist
    if (!db.users) {
      db.users = [];
    }

    // Find or create user
    const userEmail = userInfo.data.email;
    let user = db.users.find((u: User) => u.email === userEmail);

    if (user) {
      if (!tokens.refresh_token && user.tokens?.refresh_token) {
        tokens.refresh_token = user.tokens.refresh_token;
      }
      user.tokens = tokens;
      user.name = userInfo.data.name;
      user.picture = userInfo.data.picture;
      user.lastLogin = new Date().toISOString();
    } else {
      user = {
        id: userInfo.data.id,
        email: userEmail,
        name: userInfo.data.name,
        picture: userInfo.data.picture,
        tokens: tokens,
        lastLogin: new Date().toISOString(),
      };
      db.users.push(user);
    }

    // Update or create Google integration for this user
    const googleIntegration = db.integrations.find(
      (integration: Integration) =>
        integration.name === 'Google' && integration.userId === userInfo.data.id
    );

    if (googleIntegration) {
      googleIntegration.connected = true;
      if (!tokens.refresh_token && googleIntegration.tokens?.refresh_token) {
        tokens.refresh_token = googleIntegration.tokens.refresh_token;
      }
      googleIntegration.tokens = tokens;
    } else {
      db.integrations.push({
        name: 'Google',
        userId: userInfo.data.id,
        connected: true,
        tokens: tokens,
      });
    }

    await writeDb(db);

    // Create response with user session cookie
    const response = NextResponse.redirect(`${normalizedBase}/integrations`);
    response.cookies.set('user_id', userInfo.data.id || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    response.cookies.set('user_email', userEmail || '', {
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
