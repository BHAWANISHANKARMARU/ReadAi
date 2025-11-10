# Google Meet Extension Setup Guide

This guide will help you install and use the Chrome extension that scrapes Google Meet subtitles and saves them to both your app and Google Docs.

## Prerequisites

1. **Google Chrome Browser** installed
2. **Next.js app running** on `http://localhost:3000`
3. **Google Account** authenticated in the app
4. **Google API permissions** set up for Google Docs

## Extension Features

✅ Automatically scrapes Google Meet subtitles/captions in real-time
✅ Generates AI-powered meeting summaries
✅ Saves transcripts and summaries to your local database
✅ Creates Google Docs with meeting content (when authenticated)
✅ Displays meetings at `http://localhost:3000/meetings`
✅ Visual indicators (icon changes when actively capturing)
✅ Browser notifications when meetings are saved

## Installation Steps

### 1. Update Google API Scopes

First, ensure your Google OAuth app has the necessary scopes for creating Google Docs:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services > Credentials**
4. Edit your OAuth 2.0 Client ID
5. Make sure these scopes are enabled:
   - `https://www.googleapis.com/auth/documents` (for creating docs)
   - `https://www.googleapis.com/auth/drive` (for drive access)

Update your `.env.local` file if needed with the correct scopes.

### 2. Install googleapis Package

The extension uses Google APIs, so install the required package:

```bash
npm install googleapis
```

### 3. Load the Extension in Chrome

1. Open Google Chrome
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Navigate to and select the `google-meet-extension` folder in your project
6. The extension should now appear in your extensions list

### 4. Pin the Extension (Optional)

1. Click the puzzle piece icon in Chrome toolbar
2. Find "Read.ai Google Meet Extension"
3. Click the pin icon to keep it visible

## Usage Instructions

### Step 1: Start Your Next.js App

Make sure your app is running:

```bash
npm run dev
```

The app should be accessible at `http://localhost:3000`

### Step 2: Authenticate with Google

1. Go to `http://localhost:3000`
2. Sign in with your Google account
3. Grant all requested permissions
4. Verify you're logged in by checking the Integrations page

### Step 3: Join a Google Meet

1. Join or start a Google Meet call
2. **IMPORTANT:** Enable captions/subtitles in the meeting
   - Click the three dots (More options)
   - Select "Turn on captions" or press 'C'
   - Captions must be visible for the extension to capture them

### Step 4: Monitor Extension Activity

- **Icon Status:**
  - Gray icon = Inactive (not capturing)
  - Green icon = Active (capturing subtitles)
  
- The extension automatically starts capturing when it detects captions

### Step 5: End the Meeting

When you end the meeting or close the tab:

1. Extension automatically processes the transcript
2. Generates an AI summary
3. Saves to your app database
4. Creates a Google Doc (if authenticated)
5. Shows a browser notification confirming the save

### Step 6: View Your Meetings

Go to `http://localhost:3000/meetings` to see:

- All captured meetings with transcripts
- AI-generated summaries
- Links to Google Docs (if created)
- Ability to search through meetings

## Extension Popup

Click the extension icon to see:

- Current transcript being captured
- Meeting summary (after processing)
- Manual "Summarize Now" button (if needed)

## Troubleshooting

### Captions Not Being Captured

**Problem:** Extension icon stays gray, no transcript captured

**Solutions:**
1. Make sure captions are enabled in Google Meet
2. Captions must be visible on screen
3. Refresh the Google Meet page and rejoin
4. Check browser console for errors (F12 > Console)

### Meetings Not Saving

**Problem:** No notification after meeting ends

**Solutions:**
1. Check that `http://localhost:3000` is running
2. Verify you're logged in to the app
3. Check Network tab in browser DevTools for API errors
4. Ensure the `/api/meetings/save` endpoint is working

### Google Docs Not Created

**Problem:** Meeting saves but no Google Doc is created

**Solutions:**
1. Verify Google authentication in the app
2. Check that Google Docs API is enabled in Google Cloud Console
3. Ensure your OAuth app has `documents` and `drive` scopes
4. Check the app server logs for Google API errors
5. Your access token might be expired - re-authenticate

### Extension Not Loading

**Problem:** Extension doesn't appear in Chrome

**Solutions:**
1. Make sure Developer mode is enabled in `chrome://extensions/`
2. Check for errors when loading the extension
3. Verify all files exist in the `google-meet-extension` folder
4. Try removing and re-loading the extension

## File Structure

```
google-meet-extension/
├── manifest.json          # Extension configuration & permissions
├── content.js            # Scrapes captions from Google Meet page
├── background.js         # Handles data processing & API calls
├── popup.html           # Extension popup UI
├── popup.js             # Popup functionality
└── images/              # Extension icons
```

## API Endpoints Used

- `POST /api/summarize` - Generates meeting summary
- `POST /api/meetings/save` - Saves meeting data
- `GET /api/meetings/save` - Retrieves meeting list
- `GET /api/user` - Gets current user info

## Data Flow

1. **Content Script** (content.js) watches for subtitle changes on meet.google.com
2. Sends transcript segments to **Background Script** (background.js)
3. Background script accumulates full transcript
4. On meeting end, sends transcript to **Summarization API**
5. Saves transcript + summary to **App Database** (db.json)
6. Creates **Google Doc** with meeting content (if authenticated)
7. Shows success **Notification** to user
8. Meetings appear on **`/meetings` page**

## Google Docs Integration

When a meeting is saved with a logged-in user:

1. A new Google Doc is automatically created
2. Document contains:
   - Meeting date and time
   - AI-generated summary
   - Full transcript
3. Document is saved to your Google Drive
4. Link appears on the meetings page

## Security Notes

- Extension only runs on `meet.google.com` domains
- Requires explicit permissions for localhost and Google APIs
- User authentication required for Google Docs integration
- All data stored locally or in your Google account

## Performance Tips

1. **Auto-refresh:** Meetings page refreshes every 30 seconds
2. **Large transcripts:** May take a few seconds to process
3. **Network:** Requires stable internet for API calls
4. **Multiple meetings:** Extension resets between meetings automatically

## Support

If you encounter issues:

1. Check browser console logs (F12)
2. Check extension background page logs (`chrome://extensions/` > Details > "Inspect views: service worker")
3. Verify all API endpoints are working
4. Ensure Google Cloud Console permissions are correct

## Development Notes

To modify the extension:

1. Make changes to files in `google-meet-extension/`
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes in a new Google Meet

## Next Steps

- Test the extension with a real Google Meet
- Check the `/meetings` page for captured data
- Verify Google Docs are being created
- Customize the summarization prompts if needed

---

**Need Help?** Check the browser console and app server logs for detailed error messages.
