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

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.notes || []); // Return notes, or an empty array if none exist
}

export async function POST(request: Request) {
  const newNote = await request.json();
  const db = await readDb();

  // Assign a unique ID to the new note
  newNote.id = Date.now().toString(); // Simple unique ID for now

  db.notes.push(newNote);
  await writeDb(db);

  return NextResponse.json(newNote, { status: 201 });
}
