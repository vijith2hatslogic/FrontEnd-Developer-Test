# Troubleshooting: Recordings Not Showing in Submission Details

## Issue

The recording URLs are not appearing in the Submission Details page after a candidate completes a test.

## Quick Diagnosis Steps

### Step 1: Check Browser Console (Candidate Side)

When the candidate stops recording and submits the test:

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for these messages:
   ```
   Wistia webcam upload successful: {hashedId: "...", embedUrl: "...", ...}
   Wistia screen upload successful: {hashedId: "...", embedUrl: "...", ...}
   ```

**If you see errors instead:**
- Check if the Wistia API token is correct in `.env.local`
- Verify network connectivity
- Check for CORS errors

### Step 2: Check Debug Info (Admin Side)

I've added debug information to the submission view page:

1. Navigate to a submission: `/dashboard/tests/{testId}/submissions/{submissionId}`
2. Look for the gray "Debug Info" box
3. It will show:
   - Whether recordings are available
   - The first 100 characters of the URL

**What to look for:**
- If it says "Not available" → recordings didn't save
- If it shows a URL starting with `https://fast.wistia.net/embed/iframe/` → Wistia upload succeeded
- If it shows `data:image` or `data:video` → Fallback to base64 was used

### Step 3: Verify Database Columns Exist

The database needs `webcam_recording` and `screen_recording` columns.

**Check if migrations were applied:**

```bash
# Option 1: Check directly in Supabase Dashboard
# Go to https://supabase.com → Your Project → Table Editor → test_submissions
# Look for webcam_recording and screen_recording columns

# Option 2: Apply migration script
cd /Users/2hatslogic/Documents/Front-end\ Developer\ Machine\ Test/frontend-dev-test
chmod +x apply-migration.sh
./apply-migration.sh
```

**Alternative: Manual SQL**

If the script doesn't work, run this SQL directly in Supabase SQL Editor:

```sql
ALTER TABLE test_submissions ADD COLUMN IF NOT EXISTS webcam_recording TEXT;
ALTER TABLE test_submissions ADD COLUMN IF NOT EXISTS screen_recording TEXT;
```

## Common Issues & Solutions

### Issue 1: "Uploading..." Never Completes

**Symptoms:**
- Recording manager shows "Uploading to Wistia..." indefinitely
- Test submission hangs

**Solutions:**
1. Check Wistia API token is correct
2. Verify token in `.env.local`:
   ```
   NEXT_PUBLIC_WISTIA_API_TOKEN=f80a7b1114f975a23bb0fe6305651ac16e15773de7e7da737b36898f1385d1ac
   ```
3. Restart dev server after changing `.env.local`:
   ```bash
   # Ctrl+C to stop
   npm run dev
   ```
4. Check Wistia API status: https://status.wistia.com

### Issue 2: Recordings Save as Base64 Instead of Wistia URL

**Symptoms:**
- Debug info shows `data:video` or `data:image` instead of Wistia URL
- Browser console shows Wistia upload errors

**Solutions:**
1. Check browser console for specific error message
2. Common errors:
   - **401 Unauthorized**: Wrong API token
   - **Network Error**: CORS or connectivity issue
   - **413 Payload Too Large**: Recording file too big

**If file too big:**
- Reduce recording duration for testing
- Check recording bitrate settings in BasicRecordingManager.tsx (lines 164, 194)

### Issue 3: No Debug Info Appears

**Symptoms:**
- Submission page doesn't show debug box
- Recording sections are empty

**Solutions:**
1. Clear browser cache and hard reload (Ctrl+Shift+R)
2. Check if submission actually has recording data:
   ```javascript
   // In browser console on submission page:
   console.log(window.location.href); // Copy the submission ID
   // Then check the database directly in Supabase
   ```
3. Verify the test was submitted after implementing Wistia integration

### Issue 4: "Not available" in Debug Info

**Symptoms:**
- Debug info shows "Webcam Recording: Not available"
- Debug info shows "Screen Recording: Not available"

**Possible Causes:**

1. **Candidate didn't grant permissions**
   - They must click "Enable Webcam" and "Share Screen"
   - They must click "Start Recording" before taking test

2. **Recording data not submitted**
   - Check browser console during test submission
   - Look for submission data logs

3. **Database columns missing**
   - Apply migration (see Step 3 above)

4. **Old submission (before Wistia integration)**
   - Create a new test submission to verify

## Detailed Testing Procedure

### Test Wistia Integration End-to-End

1. **Create a Test:**
   ```
   - Go to /dashboard
   - Click "Create New Test"
   - Select any tech stacks
   - Create the test
   ```

2. **Take the Test:**
   ```
   - Copy test URL
   - Open in new incognito window
   - Enter candidate info (e.g., name: "Test User")
   - Click "Enable Webcam" → Allow
   - Click "Share Screen" → Allow
   - Click "Start Recording"
   - Wait for "Recording in progress..." message
   ```

3. **Monitor Console:**
   ```
   Open DevTools → Console
   Look for:
   - "Starting recording..."
   - "Recording in progress..."
   ```

4. **Submit Test:**
   ```
   - Complete at least one task (can be minimal)
   - Click "Stop Recording" or "Submit Test"
   - Watch console for:
     * "Uploading webcam recording to Wistia..."
     * "Uploading screen recording to Wistia..."
     * "Wistia webcam upload successful: ..."
     * "Wistia screen upload successful: ..."
   ```

5. **Check Wistia Account:**
   ```
   - Go to https://wistia.com
   - Log in to your account
   - Navigate to "Media"
   - Look for videos named:
     * webcam-test-user-{timestamp}.webm
     * screen-test-user-{timestamp}.webm
   ```

6. **View in Dashboard:**
   ```
   - Go to /dashboard
   - Click "View" on the test
   - Click "View Submission" on the new submission
   - Check Debug Info box
   - Should show Wistia URLs
   - Should display embedded videos below
   ```

## Checking Stored Data

### Method 1: Browser Console (Admin Dashboard)

On the submission view page, open console and run:

```javascript
// This will log the full submission data
const submission = document.querySelector('[data-submission]'); // Adjust selector
console.log('Submission data:', submission);
```

### Method 2: Supabase Dashboard

1. Go to Supabase Dashboard
2. Table Editor → test_submissions
3. Find your submission by candidate name
4. Check columns:
   - `webcam_recording`: Should contain Wistia URL or base64
   - `screen_recording`: Should contain Wistia URL or base64

### Method 3: Check LocalStorage (Test Page)

While candidate is taking test:

```javascript
// In browser console
console.log(localStorage.getItem('candidateInfo'));
```

## Environment Variables Checklist

Verify your `.env.local` file has:

```bash
# Required for the app to run
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_EMAIL=vijith@2hatslogic.com

# Required for Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Required for Wistia
NEXT_PUBLIC_WISTIA_API_TOKEN=f80a7b1114f975a23bb0fe6305651ac16e15773de7e7da737b36898f1385d1ac
```

**After changing `.env.local`:**
```bash
# Stop the server (Ctrl+C)
# Restart
npm run dev
```

## Still Not Working?

### Enable Full Debug Logging

Add this to `src/lib/wistiaService.ts` at the top:

```typescript
const DEBUG = true; // Set to false to disable

function log(...args: any[]) {
  if (DEBUG) console.log('[Wistia]', ...args);
}

// Then use log() instead of console.log() throughout the file
```

### Check Recording Manager State

Add this to `BasicRecordingManager.tsx` in the component:

```typescript
useEffect(() => {
  console.log('[Recording] State:', {
    webcamPermissionGranted,
    screenPermissionGranted,
    isRecording,
    uploadingToWistia,
    recordingStatus
  });
}, [webcamPermissionGranted, screenPermissionGranted, isRecording, uploadingToWistia, recordingStatus]);
```

### Test Wistia API Directly

Create a test file `test-wistia.html`:

```html
<!DOCTYPE html>
<html>
<head><title>Test Wistia Upload</title></head>
<body>
  <h1>Test Wistia Upload</h1>
  <input type="file" id="fileInput" accept="video/*">
  <button onclick="upload()">Upload</button>
  <div id="result"></div>

  <script>
    async function upload() {
      const file = document.getElementById('fileInput').files[0];
      if (!file) return alert('Select a file first');

      const formData = new FormData();
      formData.append('file', file, 'test.webm');

      try {
        const response = await fetch('https://upload.wistia.com', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer f80a7b1114f975a23bb0fe6305651ac16e15773de7e7da737b36898f1385d1ac'
          },
          body: formData
        });

        const data = await response.json();
        document.getElementById('result').innerHTML = 
          '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
      } catch (err) {
        document.getElementById('result').innerHTML = 
          '<pre>Error: ' + err.message + '</pre>';
      }
    }
  </script>
</body>
</html>
```

Open this file in a browser and test upload directly.

## Contact Support

If you've tried all the above and still have issues:

1. **Copy Debug Info:**
   - Browser console logs during recording
   - Debug info from submission page
   - Any error messages

2. **Check Wistia Account:**
   - Are videos appearing in Wistia dashboard?
   - If yes: Issue is with display
   - If no: Issue is with upload

3. **Database Check:**
   - Export a submission from Supabase
   - Check if `webcam_recording` and `screen_recording` fields have data

4. **Provide:**
   - Browser used (Chrome, Firefox, etc.)
   - Any console errors
   - Screenshots of debug info
   - Whether videos appear in Wistia account

---

**Most Common Fix:** Restart the dev server after updating `.env.local` with the Wistia API token! 🔄

