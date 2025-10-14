# Fix: NULL Share URLs in Database

## Problem
The `webcam_share_url` and `screen_share_url` columns are showing NULL in the database even after implementing the feature.

## Root Causes & Solutions

### ✅ Cause 1: Database Migration Not Applied

**Check if columns exist:**
```sql
-- Run in Supabase SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'test_submissions' 
AND column_name IN ('webcam_share_url', 'screen_share_url');
```

**Solution: Apply Migration**

```bash
cd /Users/2hatslogic/Documents/Front-end\ Developer\ Machine\ Test/frontend-dev-test

# Method 1: Use script
chmod +x apply-migration.sh
./apply-migration.sh

# Method 2: Manual SQL (in Supabase Dashboard → SQL Editor)
ALTER TABLE test_submissions 
ADD COLUMN IF NOT EXISTS webcam_share_url TEXT,
ADD COLUMN IF NOT EXISTS screen_share_url TEXT;
```

### ✅ Cause 2: Old Test Submissions

**Issue**: Submissions created BEFORE implementing share URLs won't have them.

**Solution**: 
- Create a NEW test submission
- Old submissions will remain NULL (expected behavior)

### ✅ Cause 3: Console Logging to Debug

**Added Debug Logging:**

I've added console logging in two places:

**1. Test Submission Page** (`src/app/test/[testUrl]/page.tsx`)
When submitting test, check console for:
```javascript
Preparing submission with recordings: {
  webcamShareUrl: "https://home.wistia.com/medias/..."  // Should have URL
  screenShareUrl: "https://home.wistia.com/medias/..."  // Should have URL
}
```

**2. Storage Service** (`src/lib/storage.ts`)
When saving to database, check console for:
```javascript
Submitting data to Supabase: {
  webcam_share_url: "https://home.wistia.com/medias/..."
  screen_share_url: "https://home.wistia.com/medias/..."
  webcamShareUrl: "https://home.wistia.com/medias/..."  // NEW
  screenShareUrl: "https://home.wistia.com/medias/..."  // NEW
}
```

**If you see "NOT PROVIDED" or "NOT SET":**
- Share URLs aren't being captured from Wistia
- Check Wistia upload response in browser console

## 🔍 Step-by-Step Debugging

### Step 1: Check Database Schema

```bash
# In Supabase Dashboard:
# 1. Go to Table Editor
# 2. Select "test_submissions" table
# 3. Look for columns: webcam_share_url, screen_share_url
# 4. If they don't exist → Run migration
```

### Step 2: Restart Dev Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 3: Create New Test Submission

1. Open browser with DevTools (F12)
2. Go to Console tab
3. Create and take a test
4. Enable webcam and screen recording
5. Start recording
6. Watch for these console messages:

**During Recording Stop:**
```
Wistia webcam upload successful: {
  hashedId: "abc123",
  embedUrl: "https://fast.wistia.net/embed/iframe/abc123",
  shareUrl: "https://home.wistia.com/medias/abc123",  ← Should be present!
  ...
}

Wistia screen upload successful: {
  hashedId: "def456",
  embedUrl: "https://fast.wistia.net/embed/iframe/def456",
  shareUrl: "https://home.wistia.com/medias/def456",  ← Should be present!
  ...
}
```

**During Test Submission:**
```
Preparing submission with recordings: {
  webcamShareUrl: "https://home.wistia.com/medias/abc123",  ← Should NOT be "NOT SET"
  screenShareUrl: "https://home.wistia.com/medias/def456",  ← Should NOT be "NOT SET"
  ...
}

Submitting data to Supabase: {
  webcam_share_url: "https://home.wistia.com/medias/abc123",
  screen_share_url: "https://home.wistia.com/medias/def456",
  ...
}
```

### Step 4: Check Database

```sql
-- In Supabase SQL Editor
SELECT 
  candidate_name,
  webcam_share_url,
  screen_share_url,
  created_at
FROM test_submissions
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result:**
```
candidate_name  | webcam_share_url                     | screen_share_url
----------------|--------------------------------------|--------------------------------------
Test User       | https://home.wistia.com/medias/abc   | https://home.wistia.com/medias/def
```

## 🐛 Troubleshooting Scenarios

### Scenario 1: Columns Don't Exist

**Symptoms:**
- SQL query returns 0 rows when checking columns
- Error in console about unknown columns

**Fix:**
```bash
./apply-migration.sh
# OR run SQL manually
```

### Scenario 2: Share URLs Show "NOT SET" in Console

**Symptoms:**
- Console shows: `webcamShareUrl: "NOT SET"`
- Wistia upload successful but no shareUrl

**Possible Causes:**
1. Wistia response doesn't include shareUrl
2. BasicRecordingManager not passing shareUrl correctly

**Fix - Check Wistia Response:**
Look at the "Wistia upload successful" log:
```javascript
// Should include shareUrl property
{
  hashedId: "...",
  embedUrl: "...",
  shareUrl: "...",  ← This must be present!
  thumbnailUrl: "...",
  duration: ...
}
```

If `shareUrl` is missing from Wistia response, check `src/lib/wistiaService.ts`:
```typescript
return {
  hashedId: data.hashed_id,
  embedUrl: `https://fast.wistia.net/embed/iframe/${data.hashed_id}`,
  shareUrl: `https://home.wistia.com/medias/${data.hashed_id}`,  ← Check this line
  thumbnailUrl: data.thumbnail?.url || '',
  duration: data.duration,
};
```

### Scenario 3: Share URLs Show "NOT PROVIDED" in Storage Service

**Symptoms:**
- "NOT SET" doesn't show in test page console
- But "NOT PROVIDED" shows in storage service console

**Cause:** Data not being passed from test page to storage service

**Fix - Check Test Page State:**
```typescript
// In src/app/test/[testUrl]/page.tsx
// Make sure these state variables are populated:
const [webcamShareUrl, setWebcamShareUrl] = useState<string>('')
const [screenShareUrl, setScreenShareUrl] = useState<string>('')

// And callbacks are working:
onWebcamRecordingComplete={(data, shareUrl) => {
  setWebcamRecordingData(data)
  if (shareUrl) setWebcamShareUrl(shareUrl)  ← Check this
  setRecordingStarted(true)
}}
```

### Scenario 4: Database Still Shows NULL

**Symptoms:**
- Console logs show correct URLs
- Migration applied
- But database still NULL

**Possible Causes:**
1. Supabase insert failing silently
2. Column names mismatch
3. Database permissions issue

**Fix - Check Supabase Response:**
```typescript
// In src/lib/storage.ts, after insert:
const { data, error: submissionError } = await supabase
  .from('test_submissions')
  .insert(submissionData)
  .select();

console.log('Supabase insert result:', { data, error: submissionError });
```

## 🎯 Quick Fix Checklist

- [ ] Run database migration
- [ ] Restart dev server
- [ ] Create NEW test submission
- [ ] Check browser console during test
- [ ] Verify Wistia upload includes shareUrl
- [ ] Check "Preparing submission" log
- [ ] Check "Submitting to Supabase" log
- [ ] Query database to confirm

## 🔄 Complete Fix Procedure

```bash
# 1. Apply migration
cd /Users/2hatslogic/Documents/Front-end\ Developer\ Machine\ Test/frontend-dev-test
chmod +x apply-migration.sh
./apply-migration.sh

# 2. Restart server
# Press Ctrl+C to stop
npm run dev

# 3. Open browser with DevTools (F12)
# 4. Create new test submission
# 5. Watch console for logs
# 6. Check database after submission
```

## 📝 Verification SQL

```sql
-- Check if columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'test_submissions' 
AND column_name LIKE '%share%';

-- Check latest submissions
SELECT 
  id,
  candidate_name,
  LENGTH(webcam_share_url) as webcam_url_length,
  LENGTH(screen_share_url) as screen_url_length,
  SUBSTRING(webcam_share_url, 1, 50) as webcam_preview,
  SUBSTRING(screen_share_url, 1, 50) as screen_preview,
  submitted_at
FROM test_submissions
ORDER BY submitted_at DESC
LIMIT 5;
```

## ✅ Success Indicators

You'll know it's working when:

1. **Console shows:**
   ```
   Wistia webcam upload successful: { shareUrl: "https://home.wistia.com/..." }
   Wistia screen upload successful: { shareUrl: "https://home.wistia.com/..." }
   Preparing submission: { webcamShareUrl: "https://...", screenShareUrl: "https://..." }
   Submitting to Supabase: { webcam_share_url: "https://...", screen_share_url: "https://..." }
   ```

2. **Database shows:**
   ```
   webcam_share_url: https://home.wistia.com/medias/abc123
   screen_share_url: https://home.wistia.com/medias/def456
   ```

3. **Admin dashboard shows:**
   - Blue "📹 Wistia Recording Links" box
   - Clickable "View on Wistia" links
   - Debug info shows share URLs

---

**Most Common Fix**: Run the migration script and create a NEW test submission!

