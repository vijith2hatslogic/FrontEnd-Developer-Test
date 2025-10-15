# 🔍 Debug: Share URLs Not Saving to Database

## Quick Diagnosis

### Step 1: Check Console Logs
When you submit a test, look for these logs in browser console:

**Expected Success Logs:**
```javascript
[Test Page] Webcam recording complete { 
  dataType: "Wistia", 
  hasShareUrl: true, 
  shareUrl: "https://home.wistia.com/medias/abc123" 
}

[Test Page] Screen recording complete { 
  dataType: "Wistia", 
  hasShareUrl: true, 
  shareUrl: "https://home.wistia.com/medias/def456" 
}

Preparing submission with recordings: {
  webcamShareUrl: "https://home.wistia.com/medias/abc123",  ← Should show real URL
  screenShareUrl: "https://home.wistia.com/medias/def456"   ← Should show real URL
}

Submitting data to Supabase: {
  webcam_share_url: "https://home.wistia.com/medias/abc123",  ← Should show real URL
  screen_share_url: "https://home.wistia.com/medias/def456"   ← Should show real URL
}
```

**If you see "NOT SET" or "NOT PROVIDED":**
- The submit is happening before Wistia uploads complete
- Wait for both "[Test Page] ... recording complete" logs before clicking Submit

### Step 2: Check Database Columns
Run this in Supabase SQL Editor:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'test_submissions' 
  AND column_name IN ('webcam_share_url', 'screen_share_url');
```

**Expected Result:**
```
column_name        | data_type
webcam_share_url   | text
screen_share_url   | text
```

**If columns are missing, add them:**
```sql
ALTER TABLE test_submissions 
ADD COLUMN IF NOT EXISTS webcam_share_url TEXT,
ADD COLUMN IF NOT EXISTS screen_share_url TEXT;
```

### Step 3: Check RLS Policies
```sql
-- Check if insert policy exists
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'test_submissions';
```

**If no insert policy, create one:**
```sql
DROP POLICY IF EXISTS insert_test_submissions ON public.test_submissions;

CREATE POLICY insert_test_submissions
ON public.test_submissions
AS PERMISSIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.tests t WHERE t.id = test_submissions.test_id)
);
```

### Step 4: Check Latest Submission
```sql
-- Check the most recent submission
SELECT 
  id,
  candidate_name,
  submitted_at,
  webcam_share_url,
  screen_share_url,
  CASE 
    WHEN webcam_share_url IS NULL THEN 'NULL'
    ELSE 'HAS_VALUE'
  END as webcam_status,
  CASE 
    WHEN screen_share_url IS NULL THEN 'NULL'
    ELSE 'HAS_VALUE'
  END as screen_status
FROM test_submissions 
ORDER BY submitted_at DESC 
LIMIT 1;
```

## Common Issues & Fixes

### Issue 1: Submit Too Early
**Symptom:** Console shows "NOT SET" or "NOT PROVIDED"
**Fix:** Wait for both recording complete logs before clicking Submit

### Issue 2: Missing Columns
**Symptom:** SQL check shows no webcam_share_url/screen_share_url columns
**Fix:** Run the ALTER TABLE command above

### Issue 3: RLS Blocking
**Symptom:** Console shows "Supabase submission error" with code 42501
**Fix:** Create the insert policy above

### Issue 4: Wrong Data Type
**Symptom:** Columns exist but still NULL
**Fix:** Ensure columns are TEXT type, not JSONB

## Test Flow
1. Start recording
2. Record for 10+ seconds
3. Click Submit
4. Watch console for both "recording complete" logs
5. Wait for "Submitting data to Supabase" with real URLs
6. Check database with SQL query above

## Success Indicators
✅ Console shows real Wistia URLs in "Submitting data to Supabase"
✅ Database query shows non-NULL values for both share URLs
✅ Admin page shows "📹 Wistia Recording Links" section with clickable links
