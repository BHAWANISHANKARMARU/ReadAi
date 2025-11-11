import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

const scopes = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    `${requestUrl.protocol}//${requestUrl.host}`;
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const redirectUri = `${normalizedBase}/api/auth/google/callback`;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
    redirect_uri: redirectUri,
  });

  return NextResponse.redirect(url);
}
