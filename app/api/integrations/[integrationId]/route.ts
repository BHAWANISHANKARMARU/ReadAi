import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { integrationId: string } }
) {
  const { integrationId } = await params;
  const { connected } = await request.json();

  // Since db.json is removed, we cannot persist the state.
  // For a real application, this would be replaced with a database update.
  return NextResponse.json({ id: parseInt(integrationId), connected });
}
