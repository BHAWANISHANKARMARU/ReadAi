import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { Credentials } from 'google-auth-library';

const dbPath = path.join(process.cwd(), 'data', 'db.json');



interface Note {
  id: string; // Changed to string as Date.now().toString() is used
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

interface Meeting {
  id: string;
  title: string;
  date: string;
  meetingEndTimestamp: string;
  transcript: string;
  chatMessages: string;
  summary: string;
  userId: string | null;
  source: 'extension';
  meetingSoftware: string;
  lastUpdated: string;
  raw: Record<string, unknown>; // Raw payload can be anything
}

interface DbData {
  integrations: Integration[];
  notes: Note[];
  users: User[];
  meetings: Meeting[];
}

async function readDb(): Promise<DbData> {
  try {
    await fs.access(dbPath, fs.constants.F_OK); // Check if file exists
    const fileContent = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: unknown) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') { // File not found
      return { integrations: [], notes: [], users: [], meetings: [] }; // Return default empty structure with notes array
    }
    throw error; // Re-throw other errors
  }
}

async function writeDb(data: DbData) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

export async function GET() {
  const db: DbData = await readDb();
  return NextResponse.json(db.notes || []); // Return notes, or an empty array if none exist
}

export async function POST(request: Request) {
  const newNote: Note = await request.json();
  const db: DbData = await readDb();

  // Assign a unique ID to the new note
  newNote.id = Date.now().toString(); // Simple unique ID for now

  db.notes.push(newNote);
  await writeDb(db);

  return NextResponse.json(newNote, { status: 201 });
}
