import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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
  userId?: string | null; // Make userId optional
  connected: boolean;
  tokens?: Credentials; // Make tokens optional
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

const defaultIntegrations = [
  { id: 1, name: 'Google' },
  { id: 2, name: 'Zoom' },
  { id: 3, name: 'Outlook' },
];

export async function GET() {
  const db: DbData = await readDb();
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value ?? null;

  const integrations = defaultIntegrations.map(({ id, name }) => {
    const dbIntegration = (db.integrations || []).find(
      (i: Integration) =>
        i.name === name &&
        (userId ? i.userId === userId : !i.userId)
    );
    return {
      id,
      name,
      connected: dbIntegration ? !!dbIntegration.connected : false,
    };
  });

  return NextResponse.json(integrations);
}
