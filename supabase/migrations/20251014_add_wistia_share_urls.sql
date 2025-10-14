-- Add Wistia shareable URL columns to test_submissions table
ALTER TABLE test_submissions ADD COLUMN IF NOT EXISTS webcam_share_url TEXT;
ALTER TABLE test_submissions ADD COLUMN IF NOT EXISTS screen_share_url TEXT;

-- Add comments to clarify column usage
COMMENT ON COLUMN test_submissions.webcam_recording IS 'Wistia embed URL or base64 data for webcam recording';
COMMENT ON COLUMN test_submissions.screen_recording IS 'Wistia embed URL or base64 data for screen recording';
COMMENT ON COLUMN test_submissions.webcam_share_url IS 'Wistia shareable URL for webcam recording';
COMMENT ON COLUMN test_submissions.screen_share_url IS 'Wistia shareable URL for screen recording';

