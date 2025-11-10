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
      return { integrations: [], notes: [], meetings: [] };
    }
    throw error;
  }
}

async function writeDb(data: any) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.meetings ?? []);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const db = await readDb();

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

    const record = {
      id,
      title: meetingTitle,
      date: new Date(endTs).toLocaleString(),
      meetingEndTimestamp: endTs,
      transcript,
      chatMessages: payload.chatMessages || '',
      summary: payload.summary || '',
      userId: payload.userId || null,
      source: 'extension' as const,
      meetingSoftware: payload.meetingSoftware || 'Google Meet',
      lastUpdated: nowIso,
      raw: payload,
    };

    db.meetings = Array.isArray(db.meetings) ? db.meetings : [];
    // Avoid duplicates by id if provided by extension
    const existingIndex = db.meetings.findIndex((m: any) => m.id === record.id);
    if (existingIndex >= 0) {
      db.meetings[existingIndex] = { ...db.meetings[existingIndex], ...record };
    } else {
      db.meetings.push(record);
    }
    await writeDb(db);

    return NextResponse.json({ ok: true, id: record.id }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving meeting from webhook:', error);
    return NextResponse.json(
      { message: 'Failed to save meeting', error: error?.message },
      { status: 400 },
    );
  }
}


