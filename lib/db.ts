import { sql } from '@vercel/postgres';

export interface User {
  id: number;
  google_id: string;
  email: string;
  name: string;
  picture: string;
  access_token: string;
  refresh_token?: string;
  created_at: Date;
  last_login: Date;
}

export interface Meeting {
  id: number; // Primary key from DB
  external_id: string; // ID from the extension
  user_google_id: string;
  title: string;
  meeting_timestamp: Date;
  transcript: string;
  summary: string;
  source: string;
  meeting_software: string;
  raw_payload: object; // JSONB type
  created_at: Date;
  updated_at: Date;
}

export async function upsertUser({
  googleId,
  email,
  name,
  picture,
  accessToken,
  refreshToken,
}: {
  googleId: string;
  email: string;
  name: string;
  picture: string;
  accessToken: string;
  refreshToken?: string;
}): Promise<User> {
  const now = new Date();

  const result = await sql`
    INSERT INTO users (google_id, email, name, picture, access_token, refresh_token, last_login)
    VALUES (${googleId}, ${email}, ${name}, ${picture}, ${accessToken}, ${refreshToken}, ${now.toISOString()})
    ON CONFLICT (google_id)
    DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      picture = EXCLUDED.picture,
      access_token = EXCLUDED.access_token,
      refresh_token = COALESCE(${refreshToken}, users.refresh_token),
      last_login = ${now.toISOString()}
    RETURNING *;
  `;

  return result.rows[0] as User;
}

export async function findUserByGoogleId(googleId: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users WHERE google_id = ${googleId};
  `;
  if (result.rows.length > 0) {
    return result.rows[0] as User;
  }
  return null;
}

export async function deleteUserByGoogleId(googleId: string) {
  const result = await sql`
    DELETE FROM users WHERE google_id = ${googleId};
  `;
  return result;
}

export async function createOrUpdateMeeting({
  externalId,
  userGoogleId,
  title,
  meetingTimestamp,
  transcript,
  summary,
  source,
  meetingSoftware,
  rawPayload,
}: {
  externalId: string;
  userGoogleId: string;
  title: string;
  meetingTimestamp: Date;
  transcript: string;
  summary: string;
  source: string;
  meetingSoftware: string;
  rawPayload: object;
}): Promise<Meeting> {
  const now = new Date();
  const result = await sql`
    INSERT INTO meetings (external_id, user_google_id, title, meeting_timestamp, transcript, summary, source, meeting_software, raw_payload, created_at, updated_at)
    VALUES (${externalId}, ${userGoogleId}, ${title}, ${meetingTimestamp}, ${transcript}, ${summary}, ${source}, ${meetingSoftware}, ${JSON.stringify(rawPayload)}, ${now.toISOString()}, ${now.toISOString()})
    ON CONFLICT (external_id)
    DO UPDATE SET
      user_google_id = EXCLUDED.user_google_id,
      title = EXCLUDED.title,
      meeting_timestamp = EXCLUDED.meeting_timestamp,
      transcript = EXCLUDED.transcript,
      summary = EXCLUDED.summary,
      source = EXCLUDED.source,
      meeting_software = EXCLUDED.meeting_software,
      raw_payload = EXCLUDED.raw_payload,
      updated_at = ${now.toISOString()}
    RETURNING *;
  `;
  return result.rows[0] as Meeting;
}

export async function getMeetingsForUser(userGoogleId: string): Promise<Meeting[]> {
  const result = await sql`
    SELECT * FROM meetings WHERE user_google_id = ${userGoogleId} ORDER BY meeting_timestamp DESC;
  `;
  return result.rows as Meeting[];
}

export interface Note {
  id: number;
  user_google_id: string;
  title: string;
  summary: string;
  created_at: Date;
  updated_at: Date;
}

export async function createNote({
  userGoogleId,
  title,
  summary,
}: {
  userGoogleId: string;
  title: string;
  summary: string;
}): Promise<Note> {
  const now = new Date();
  const result = await sql`
    INSERT INTO notes (user_google_id, title, summary, created_at, updated_at)
    VALUES (${userGoogleId}, ${title}, ${summary}, ${now}, ${now})
    RETURNING *;
  `;
  return result.rows[0] as Note;
}

export async function getNotesForUser(userGoogleId: string): Promise<Note[]> {
  const result = await sql`
    SELECT * FROM notes WHERE user_google_id = ${userGoogleId} ORDER BY created_at DESC;
  `;
  return result.rows as Note[];
}

