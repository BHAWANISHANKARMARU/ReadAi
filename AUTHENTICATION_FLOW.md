# Authentication Flow Documentation

## Overview
The ReadAI application uses Google OAuth 2.0 to authenticate users and fetch their personal data from Gmail, Google Calendar, and Google Meet. Each user's data is completely isolated and dynamic.

## How It Works

### 1. User Authentication Process

When a user connects their Google account:

1. **User clicks "Connect" on Google Integration**
   - Redirects to `/api/auth/google`
   - User is sent to Google's OAuth consent screen

2. **User grants permissions**
   - Google Calendar (read-only)
   - Gmail (read-only)
   - Google Drive & Docs (read-only)
   - User profile information

3. **Google redirects back to callback**
   - Route: `/api/auth/google/callback`
   - Receives authorization code and exchanges it for tokens
   - Fetches user information from Google
   - Stores user data in database:
     ```json
     {
       "id": "google_user_id",
       "email": "user@gmail.com",
       "name": "User Name",
       "picture": "profile_picture_url",
       "tokens": {
         "access_token": "...",
         "refresh_token": "...",
         "expiry_date": "..."
       },
       "lastLogin": "2025-10-24T12:00:00Z"
     }
     ```

4. **Sets secure cookies**
   - `user_id`: Google user ID (httpOnly, 7 days)
   - `user_email`: User's email (httpOnly, 7 days)
   - These cookies identify the logged-in user for all API requests

### 2. User-Specific Data Fetching

All API endpoints check the `user_id` cookie and fetch data using that specific user's OAuth tokens:

#### `/api/google/calendar/events`
- Checks `user_id` cookie
- Finds user in database
- Uses user's access token to fetch their calendar events
- Returns only that user's upcoming calendar events

#### `/api/google/meet`
- Checks `user_id` cookie
- Finds user in database
- Uses user's access token to fetch their Google Meet events
- Returns only that user's Meet meetings with conference links

#### `/api/gmail/reports`
- Checks `user_id` cookie
- Finds user in database
- Uses user's access token to fetch their Gmail messages
- Returns only that user's recent emails

#### `/api/user`
- Checks `user_id` cookie
- Returns current logged-in user's profile information

### 3. Multi-User Support

The system supports multiple users simultaneously:

- **User A logs in**: Their data is stored with their unique Google ID
- **User B logs in**: Their data is stored with their unique Google ID
- Each user sees only their own:
  - Calendar events
  - Google Meet meetings
  - Gmail messages
  - Notes (when scoped to user)

### 4. Data Isolation

Each API request:
1. Reads the `user_id` cookie to identify who is making the request
2. Looks up that specific user in the database
3. Retrieves that user's OAuth tokens
4. Makes API calls to Google using those tokens
5. Returns data belonging only to that user

## Security Features

1. **HttpOnly Cookies**: Cookies are not accessible via JavaScript, preventing XSS attacks
2. **Secure Cookies**: In production, cookies are transmitted only over HTTPS
3. **Token Storage**: OAuth tokens are stored server-side in the database
4. **No Client-Side Tokens**: Access tokens never reach the browser
5. **User Isolation**: Each API call validates the user identity via cookies

## Database Structure

```json
{
  "users": [
    {
      "id": "google_user_id_1",
      "email": "user1@gmail.com",
      "name": "User One",
      "tokens": { "access_token": "..." }
    },
    {
      "id": "google_user_id_2",
      "email": "user2@gmail.com",
      "name": "User Two",
      "tokens": { "access_token": "..." }
    }
  ],
  "integrations": [...],
  "notes": [...]
}
```

## Testing the Flow

1. **Open the application**: http://localhost:3000
2. **Go to Integrations page**: Click "Integrations" in sidebar
3. **Connect Google account**: Click "Connect" button
4. **Grant permissions**: Allow access to Calendar, Gmail, etc.
5. **Redirected back**: You'll be redirected to integrations page
6. **View Dashboard**: Your personal calendar events and Meet meetings will appear
7. **View Reports**: Your personal Gmail messages will appear

## Troubleshooting

### "User not authenticated" error
- **Cause**: No user_id cookie present
- **Solution**: Connect your Google account via Integrations page

### "Google Calendar not connected" error
- **Cause**: User exists but has no tokens
- **Solution**: Reconnect your Google account

### No data showing
- **Cause**: You may not have any upcoming events or recent emails
- **Solution**: Create a calendar event or check if you have emails in Gmail

## Summary

✅ **Dynamic Data**: Each user sees only their own data  
✅ **User Authentication**: Google OAuth 2.0 with proper scopes  
✅ **Secure Storage**: Tokens stored server-side  
✅ **User Isolation**: Cookie-based session management  
✅ **Multi-User Ready**: Supports multiple concurrent users  
✅ **Real-time Sync**: Dashboard auto-refreshes every 30 seconds
