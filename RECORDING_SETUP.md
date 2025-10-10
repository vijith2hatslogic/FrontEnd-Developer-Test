# Setting Up Webcam and Screen Recording

This document explains how to set up and troubleshoot the webcam and screen recording functionality for the frontend developer test platform.

## Database Setup

The application requires two columns in the `test_submissions` table to store recording data:
- `webcam_recording`: Stores the webcam recording data
- `screen_recording`: Stores the screen recording data

### Applying the Migration

1. Make sure the Supabase database is accessible
2. Run the migration script:
   ```bash
   ./apply-migration.sh
   ```
   
   Or manually apply the SQL:
   ```sql
   ALTER TABLE test_submissions ADD COLUMN IF NOT EXISTS webcam_recording TEXT;
   ALTER TABLE test_submissions ADD COLUMN IF NOT EXISTS screen_recording TEXT;
   ```

## Troubleshooting

If recordings are not showing up in the admin submission details page:

### 1. Check if the database columns exist

Connect to your Supabase database and verify that the `webcam_recording` and `screen_recording` columns exist in the `test_submissions` table:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'test_submissions';
```

### 2. Check recording sizes

Recordings are stored as base64-encoded strings, which can be very large. The application will automatically truncate recordings that are too large to fit in the database.

If you need to store larger recordings, consider:
- Using a blob storage solution (like AWS S3 or Supabase Storage)
- Adjusting the `maxChunkSize` value in `src/lib/storage.ts`

### 3. Check browser compatibility

The recording functionality uses the MediaRecorder API, which might not be supported in all browsers. If recording is not working:
- Try using Chrome or Firefox, which have better support for MediaRecorder
- Check the browser console for errors
- The application will fall back to taking screenshots if video recording is not supported

## Advanced Configuration

For production environments, you might want to:

1. Store recordings in a dedicated storage service (like AWS S3)
2. Implement a chunking mechanism for large recordings
3. Add compression to reduce storage requirements
4. Set up a separate media server for streaming recordings

## Debugging

The admin submission details page includes debug information showing:
- Whether recordings are available
- The size of the recordings
- A preview of the recording data

This information can help diagnose issues with recording storage and retrieval.
