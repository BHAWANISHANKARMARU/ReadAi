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

export async function GET(request: Request, context: any) {
  const db: DbData = await readDb();
  const googleIntegration: Integration | undefined = db.integrations.find(
    (integration: Integration) => integration.name === 'Google'
  );

  if (!googleIntegration || !googleIntegration.tokens) {
    return NextResponse.json({ message: 'Google account not connected' }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/auth/google/callback'
  );

  oauth2Client.setCredentials(googleIntegration.tokens);

  const docs = google.docs({ version: 'v1', auth: oauth2Client });

  try {
    const response = await docs.documents.get({
      documentId: context.params.docId,
    });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ message: 'Error fetching document' }, { status: 500 });
  }
}
