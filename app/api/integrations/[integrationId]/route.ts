import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteUserByGoogleId } from '@/lib/db';

export async function PUT(
  request: NextRequest
) {
  try {
    const integrationId = request.nextUrl.pathname.split('/').pop();
    const { connected } = await request.json();

    if (!integrationId) {
      return NextResponse.json({ message: 'Integration ID not found' }, { status: 400 });
    }

    const id = parseInt(integrationId, 10);
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    // This endpoint is now only for DISCONNECTING.
    // Connecting is handled by the /api/auth/google flow.
    // We only care about Google (ID 1) and when connected is false.
    if (id === 1 && connected === false && userId) {
      // Only clear cookies to log the user out, do not delete user data from the database.
      cookieStore.delete('user_id');
      cookieStore.delete('user_email');

      return NextResponse.json({
        id,
        connected: false,
        message: 'Google integration disconnected and user logged out.',
      });
    }

    // For any other case, just return the current state without changing anything.
    return NextResponse.json(
      {
        id,
        connected,
        message: 'No action taken.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating integration status:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: 'Failed to update integration status', error: errorMessage },
      { status: 500 }
    );
  }
}
