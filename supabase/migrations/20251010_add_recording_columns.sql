-- Add webcam_recording and screen_recording columns to test_submissions table
ALTER TABLE test_submissions ADD COLUMN IF NOT EXISTS webcam_recording TEXT;
ALTER TABLE test_submissions ADD COLUMN IF NOT EXISTS screen_recording TEXT;
