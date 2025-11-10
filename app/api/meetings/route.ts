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
    await fs.access(dbPath, fs.constants.F_OK);
    const fileContent = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: unknown) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { integrations: [], notes: [], users: [], meetings: [] };
    }
    throw error;
  }
}

async function writeDb(data: DbData) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

export async function GET() {
  const db: DbData = await readDb();
  return NextResponse.json(db.meetings ?? []);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const db: DbData = await readDb();

    // Normalize a few common fields the extension may send
    const nowIso = new Date().toISOString();
    const id = payload.id || crypto.randomUUID();
    const meetingTitle =
      payload.meetingTitle || payload.title || payload.meeting_code || 'Meeting';
    const endTs =
      payload.meetingEndTimestamp ||
      payload.ended_at ||
      payload.timestamp ||
      nowIso;

    const transcript =
      payload.transcript ||
      payload.full_transcript ||
      payload.text ||
      payload.content ||
      '';

    const record: Meeting = {
      id,
      title: meetingTitle,
      date: new Date(endTs).toLocaleString(),
      meetingEndTimestamp: endTs,
      transcript,
      chatMessages: payload.chatMessages || '',
      summary: payload.summary || '',
      userId: payload.userId || null,
      source: 'extension',
      meetingSoftware: payload.meetingSoftware || 'Google Meet',
      lastUpdated: nowIso,
      raw: payload,
    };

    db.meetings = Array.isArray(db.meetings) ? db.meetings : [];
    // Avoid duplicates by id if provided by extension
    const existingIndex = db.meetings.findIndex((m: Meeting) => m.id === record.id);
    if (existingIndex >= 0) {
      db.meetings[existingIndex] = { ...db.meetings[existingIndex], ...record };
    } else {
      db.meetings.push(record);
    }
    await writeDb(db);

    return NextResponse.json({ ok: true, id: record.id }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error saving meeting from webhook:', error);
    return NextResponse.json(
      { message: 'Failed to save meeting', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 },
    );
  }
}


