import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params;
    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    await sql`DELETE FROM meetings WHERE id = ${meetingId};`;

    return NextResponse.json({ message: 'Meeting deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 });
  }
}
