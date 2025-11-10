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

export async function GET() {
  const db = await readDb();
  const defaultIntegrations = [
    {
      id: 1,
      name: 'Google',
      connected: false,
    },
    {
      id: 2,
      name: 'Zoom',
      connected: false,
    },
    {
      id: 3,
      name: 'Outlook',
      connected: false,
    },
  ];

  const integrations = defaultIntegrations.map((defaultIntegration) => {
    const dbIntegration = (db.integrations || []).find(
      (i: any) => i.name === defaultIntegration.name
    );
    return {
      ...defaultIntegration,
      connected: dbIntegration ? dbIntegration.connected : false,
    };
  });

  return NextResponse.json(integrations);
}
