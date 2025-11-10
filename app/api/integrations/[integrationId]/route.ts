import { NextRequest, NextResponse } from 'next/server';
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
      return { integrations: [] };
    }
    throw error;
  }
}

async function writeDb(data: any) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ integrationId: string }> }
) {
  const { integrationId } = await context.params;
  const { connected } = await request.json();

  const id = parseInt(integrationId, 10);
  const db = await readDb();
  db.integrations = Array.isArray(db.integrations) ? db.integrations : [];

  // Map ids to names like our GET route (1: Google, 2: Zoom, 3: Outlook)
  const idToName: Record<number, string> = { 1: 'Google', 2: 'Zoom', 3: 'Outlook' };
  const name = idToName[id] ?? 'Google';

  const idx = db.integrations.findIndex((i: any) => i.name === name);
  if (idx >= 0) {
    db.integrations[idx].connected = !!connected;
  } else {
    db.integrations.push({ name, connected: !!connected });
  }

  // Optional safety: if disconnecting Google, we don't delete tokens (to avoid breakage),
  // but front-end will respect 'connected: false' and not fetch or render data.
  await writeDb(db);

  return NextResponse.json({ id, connected: !!connected });
}
