import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'db.json');

async function readDb() {
  try {
    await fs.access(dbPath, fs.constants.F_OK);
    const fileContent = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return { integrations: [], notes: [] };
    }
    throw error;
  }
}

export async function GET(request: Request, { params }: any) {
  const db = await readDb();
  const googleIntegration = db.integrations.find(
    (integration: any) => integration.name === 'Google'
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
      documentId: params.docId,
    });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ message: 'Error fetching document' }, { status: 500 });
  }
}
