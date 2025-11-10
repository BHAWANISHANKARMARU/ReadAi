# Testing Checklist for Google Meet Extension

Use this checklist to verify that your Chrome extension is working correctly.

## Pre-Testing Setup

- [ ] Next.js app is running on `http://localhost:3000`
- [ ] You are logged in to the app with your Google account
- [ ] Extension is loaded in Chrome (`chrome://extensions/`)
- [ ] Extension shows in Chrome toolbar (pin it for easy access)

## Test 1: Extension Loading

- [ ] Open `chrome://extensions/`
- [ ] "Read.ai Google Meet Extension" appears in the list
- [ ] No errors shown on the extension card
- [ ] Extension icon shows as gray/inactive

## Test 2: Google Meet Access

- [ ] Join or create a Google Meet: https://meet.google.com/
- [ ] Extension icon is visible in Chrome toolbar
- [ ] No console errors in browser DevTools (F12)

## Test 3: Caption Scraping

- [ ] In Google Meet, enable captions (Click ⋮ → Turn on captions, or press 'C')
- [ ] Captions appear at bottom of screen
- [ ] Extension icon changes to green/active color
- [ ] Click extension icon to see popup
- [ ] Popup shows captured transcript text
- [ ] Transcript updates as captions appear

## Test 4: Manual Summarization (Optional)

- [ ] While in meeting, click extension icon
- [ ] Click "Summarize Now" button
- [ ] Summary appears in popup
- [ ] No errors in console

## Test 5: Automatic Save on Meeting End

- [ ] End the meeting (hang up or close tab)
- [ ] Browser shows notification: "Meeting saved..."
- [ ] Check browser console for "Meeting saved successfully" message
- [ ] No errors in console

## Test 6: Verify Data in App

- [ ] Go to `http://localhost:3000/meetings`
- [ ] Your meeting appears in the list
- [ ] Meeting card shows:
  - [ ] Meeting title with date/time
  - [ ] "Scraped" badge (green)
  - [ ] Summary section
  - [ ] Transcript preview
- [ ] Click through to verify full data

## Test 7: Google Docs Integration

- [ ] Meeting card shows "View in Google Docs" button
- [ ] Click the button
- [ ] Google Doc opens in new tab
- [ ] Doc contains:
  - [ ] Meeting title with date
  - [ ] Summary section
  - [ ] Full transcript

## Test 8: Data Persistence

- [ ] Check `data/db.json` file
- [ ] "meetings" array contains your meeting data
- [ ] Meeting has correct structure:
  ```json
  {
    "id": "...",
    "title": "Google Meet - ...",
    "date": "...",
    "transcript": "...",
    "summary": "...",
    "googleDocsUrl": "...",
    "userId": "..."
  }
  ```

## Test 9: Multiple Meetings

- [ ] Join a new Google Meet
- [ ] Enable captions
- [ ] Verify extension captures new meeting separately
- [ ] End meeting
- [ ] Both meetings appear on `/meetings` page

## Test 10: Search Functionality

- [ ] On `/meetings` page, use search bar
- [ ] Search by meeting title
- [ ] Search by summary keywords
- [ ] Verify filtering works correctly

## Common Issues to Check

### Extension Not Capturing

- [ ] Captions are enabled and visible
- [ ] Extension has green icon (active state)
- [ ] Browser console shows no errors
- [ ] Extension has permissions for meet.google.com

### Meetings Not Saving

- [ ] App server is running (`npm run dev`)
- [ ] Check Network tab for failed API calls
- [ ] Server console shows no errors
- [ ] Database file is writable

### Google Docs Not Created

- [ ] User is authenticated in app
- [ ] Google Docs API is enabled in Google Cloud Console
- [ ] OAuth scopes include `documents` and `drive`
- [ ] Access token is valid (re-authenticate if needed)

## Debug Commands

### View Extension Logs
1. Go to `chrome://extensions/`
2. Find your extension
3. Click "Details"
4. Click "Inspect views: service worker"
5. Check console for errors

### Check API Endpoints
```bash
# Test summarize endpoint
curl -X POST http://localhost:3000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"text":"This is a test transcript"}'

# Test save endpoint
curl -X POST http://localhost:3000/api/meetings/save \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Test","summary":"Test summary","userId":"123"}'

# Get meetings
curl http://localhost:3000/api/meetings/save
```

### Check Server Logs
- Watch your terminal where `npm run dev` is running
- Look for API request logs
- Check for any error messages

## Success Criteria

✅ Extension captures captions in real-time
✅ Icon changes from gray to green when active
✅ Meetings auto-save when ended
✅ Data appears on `/meetings` page
✅ Google Docs are created (when authenticated)
✅ No console errors
✅ Browser notifications appear

## If All Tests Pass

🎉 **Congratulations!** Your Google Meet extension is working correctly!

You can now:
- Use it in real meetings
- Review transcripts and summaries
- Access meeting data from Google Docs
- Search through your meeting history

## Next Steps

- Customize the AI summarization prompts
- Add more features to the extension
- Improve the UI/UX
- Deploy to production

---

**Note:** For production use, consider:
- Better error handling
- Rate limiting on API endpoints
- Database migration from JSON to proper DB
- User-specific data isolation
- Security hardening
