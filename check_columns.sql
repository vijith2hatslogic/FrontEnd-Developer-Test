SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'test_submissions' AND column_name IN ('webcam_share_url', 'screen_share_url');
