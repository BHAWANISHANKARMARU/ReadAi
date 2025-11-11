import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMeetingsForUser, createOrUpdateMeeting } from '@/lib/db';

const allowedOrigins = [
  'chrome-extension://hoelbkkppkccenkpidjjgblcepdhhmoo',
  'http://localhost:3000',
  'https://read-ai-pi.vercel.app'
];

function addCorsHeaders(response: NextResponse, origin: string) {
  if (allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') ?? '';
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response, origin);
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
    }

    const meetings = await getMeetingsForUser(userId);
    return NextResponse.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: 'Failed to fetch meetings', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin') ?? '';
  try {
    const payload = await request.json();
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      const response = NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
      return addCorsHeaders(response, origin);
    }

    // Normalize a few common fields the extension may send
    const now = new Date();
    const externalId = payload.id || crypto.randomUUID();
    const meetingTitle =
      payload.meetingTitle || payload.title || payload.meeting_code || 'Meeting';
    const meetingEndTimestamp =
      payload.meetingEndTimestamp ||
      payload.ended_at ||
      payload.timestamp ||
      now.toISOString();

    const transcript =
      payload.transcript ||
      payload.full_transcript ||
      payload.text ||
      payload.content ||
      '';

    const summary = payload.summary || '';

    const record = await createOrUpdateMeeting({
      externalId: externalId,
      userGoogleId: userId,
      title: meetingTitle,
      meetingTimestamp: new Date(meetingEndTimestamp),
      transcript: transcript,
      summary: summary,
      source: 'extension',
      meetingSoftware: payload.meetingSoftware || 'Google Meet',
      rawPayload: payload,
    });

    const response = NextResponse.json({ ok: true, id: record.external_id }, { status: 201 });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error('Error saving meeting from webhook:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const response = NextResponse.json(
      { message: 'Failed to save meeting', error: errorMessage },
      { status: 400 }
    );
    return addCorsHeaders(response, origin);
  }
}
