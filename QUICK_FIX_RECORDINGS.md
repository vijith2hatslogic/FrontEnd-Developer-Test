# Quick Fix: Recording URLs Not Showing

## 🔴 Immediate Steps to Fix

### Step 1: Restart Development Server ⚡

**This fixes 90% of issues!**

```bash
# In your terminal:
# Press Ctrl+C to stop the server
# Then restart:
npm run dev
```

**Why:** Environment variables (like the Wistia API token) are only loaded when the server starts.

### Step 2: Check Environment Variable 🔐

Open `.env.local` and verify:

```bash
NEXT_PUBLIC_WISTIA_API_TOKEN=f80a7b1114f975a23bb0fe6305651ac16e15773de7e7da737b36898f1385d1ac
```

**Must be EXACTLY this token** (you provided it).

### Step 3: Test with a NEW Submission 🆕

**Important:** Existing submissions won't have Wistia URLs if they were created before the integration.

1. Create a new test submission after restarting the server
2. During the test, open browser console (F12)
3. Look for these success messages:
   ```
   Wistia webcam upload successful: {...}
   Wistia screen upload successful: {...}
   ```

### Step 4: View the Submission 👁️

Go to the submission details page. You should now see:

1. **Debug Info box** (gray background) showing:
   - "Webcam Recording: Available"
   - "URL: https://fast.wistia.net/embed/iframe/..."
   
2. **Embedded videos** below the debug info

## 🟡 If Still Not Working

### Check 1: Is Data Being Saved?

1. Go to submission page
2. Look at the **Debug Info** box I added
3. What does it say?

**Option A: "Not available"**
- Recording didn't upload or save
- Check browser console during test for errors
- Verify candidate clicked "Start Recording"

**Option B: Shows "data:image..." or "data:video..."**
- Wistia upload failed, fell back to base64
- Check Wistia API token is correct
- Check browser console for upload errors

**Option C: Shows "https://fast.wistia.net/..."**  
- ✅ Wistia upload worked!
- Videos should display below
- If not displaying, check browser console for iframe errors

### Check 2: Database Has Columns

Run this to ensure database has recording columns:

```bash
cd /Users/2hatslogic/Documents/Front-end\ Developer\ Machine\ Test/frontend-dev-test
chmod +x apply-migration.sh
./apply-migration.sh
```

Or manually in Supabase SQL Editor:

```sql
ALTER TABLE test_submissions 
ADD COLUMN IF NOT EXISTS webcam_recording TEXT,
ADD COLUMN IF NOT EXISTS screen_recording TEXT;
```

### Check 3: Browser Console

When taking a test, open console (F12) and watch for:

✅ **Success Messages:**
```
Recording in progress...
Uploading webcam recording to Wistia...
Wistia webcam upload successful: {hashedId: "abc123", embedUrl: "..."}
Uploading screen recording to Wistia...
Wistia screen upload successful: {hashedId: "def456", embedUrl: "..."}
```

❌ **Error Messages:**
```
Error uploading webcam to Wistia: ...
Error uploading screen to Wistia: ...
```

If you see errors, note the message and check:
- 401 Error: Wrong API token
- Network Error: Internet connection or CORS
- CORS Error: Wistia API issue (rare)

## 🟢 Verify It's Working

### Test Checklist:

- [ ] Restarted dev server after adding Wistia token
- [ ] Created a NEW test submission
- [ ] Enabled webcam and screen permissions
- [ ] Started recording
- [ ] Saw "Wistia upload successful" in console
- [ ] Debug info shows Wistia URLs
- [ ] Videos display as iframes

### Expected Result:

**Submission Details Page Should Show:**

```
Debug Info:
Webcam Recording: Available
URL: https://fast.wistia.net/embed/iframe/abc123...
Screen Recording: Available  
URL: https://fast.wistia.net/embed/iframe/def456...

Webcam Recording
[Embedded Wistia Video Player]

Screen Recording
[Embedded Wistia Video Player]
```

## 🔵 Quick Test Without Full Test

Want to verify Wistia upload works? Run this in browser console on any page:

```javascript
// Test Wistia API
fetch('https://upload.wistia.com', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer f80a7b1114f975a23bb0fe6305651ac16e15773de7e7da737b36898f1385d1ac'
  },
  body: new FormData()
}).then(r => r.text()).then(console.log).catch(console.error);
```

Should return JSON (not an error).

## 📋 Status Check Commands

```bash
# 1. Check if token is in env file
grep WISTIA .env.local

# 2. Check if migrations exist
ls -la supabase/migrations/

# 3. Check if dev server is running
# Should see: "ready - started server on..."
```

## 🆘 Still Having Issues?

See the detailed `TROUBLESHOOTING_RECORDINGS.md` file for:
- Advanced debugging
- Database verification
- Wistia account checks
- Console logging tips

## 💡 Pro Tips

1. **Always restart server after .env.local changes**
2. **Use Chrome DevTools** for best debugging
3. **Test in Incognito mode** to avoid cache issues
4. **Check Wistia.com dashboard** to see if videos uploaded
5. **Old submissions won't have Wistia URLs** - create new ones

---

**Most Likely Issue:** Server not restarted after adding Wistia token! 🔄

**Quick Win:** Stop server (Ctrl+C), run `npm run dev`, create new test submission!

