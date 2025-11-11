import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findUserByGoogleId } from '@/lib/db';

const defaultIntegrations = [
  { id: 1, name: 'Google' },
  { id: 2, name: 'Zoom' },
  { id: 3, name: 'Outlook' },
];

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    let isGoogleConnected = false;
    if (userId) {
      const user = await findUserByGoogleId(userId);
      // If a user is found, it means they have authenticated with Google.
      if (user) {
        isGoogleConnected = true;
      }
    }

    const integrations = defaultIntegrations.map(({ id, name }) => ({
      id,
      name,
      connected: name === 'Google' ? isGoogleConnected : false,
    }));

    return NextResponse.json(integrations);
  } catch (error) {
    console.error('Error fetching integrations status:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: 'Failed to fetch integrations status', error: errorMessage },
      { status: 500 }
    );
  }
}
