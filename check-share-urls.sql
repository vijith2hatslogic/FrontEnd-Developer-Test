-- Quick diagnostic SQL queries for Wistia share URLs

-- 1. Check if columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'test_submissions' 
AND column_name IN ('webcam_share_url', 'screen_share_url', 'webcam_recording', 'screen_recording');

-- Expected: Should return 4 rows with these columns

-- 2. Check latest submissions for share URLs
SELECT 
  id,
  candidate_name,
  submitted_at,
  CASE 
    WHEN webcam_share_url IS NULL THEN '❌ NULL'
    WHEN webcam_share_url = '' THEN '⚠️ EMPTY'
    ELSE '✅ HAS URL'
  END as webcam_status,
  CASE 
    WHEN screen_share_url IS NULL THEN '❌ NULL'
    WHEN screen_share_url = '' THEN '⚠️ EMPTY'
    ELSE '✅ HAS URL'
  END as screen_status,
  SUBSTRING(webcam_share_url, 1, 60) as webcam_preview,
  SUBSTRING(screen_share_url, 1, 60) as screen_preview
FROM test_submissions
ORDER BY submitted_at DESC
LIMIT 10;

-- Expected: New submissions should show "✅ HAS URL"
-- Old submissions (before feature) will show "❌ NULL" (this is expected)

-- 3. Count submissions with and without share URLs
SELECT 
  COUNT(*) as total_submissions,
  SUM(CASE WHEN webcam_share_url IS NOT NULL THEN 1 ELSE 0 END) as have_webcam_url,
  SUM(CASE WHEN screen_share_url IS NOT NULL THEN 1 ELSE 0 END) as have_screen_url,
  SUM(CASE WHEN webcam_share_url IS NULL THEN 1 ELSE 0 END) as missing_webcam_url,
  SUM(CASE WHEN screen_share_url IS NULL THEN 1 ELSE 0 END) as missing_screen_url
FROM test_submissions;

-- 4. Show actual URLs (if any exist)
SELECT 
  candidate_name,
  webcam_share_url,
  screen_share_url,
  submitted_at
FROM test_submissions
WHERE webcam_share_url IS NOT NULL 
   OR screen_share_url IS NOT NULL
ORDER BY submitted_at DESC
LIMIT 5;

-- If this returns 0 rows, no submissions have share URLs yet

