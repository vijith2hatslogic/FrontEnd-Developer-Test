# Wistia Integration Documentation

## Overview

This document describes the Wistia API integration for recording and managing test candidate video submissions. The integration allows automatic upload of webcam and screen recordings to Wistia, providing sharable URLs that can be viewed directly in the admin dashboard.

## Features

- **Automatic Upload**: Recordings are automatically uploaded to Wistia when candidates stop recording
- **Sharable URLs**: Each recording gets a unique Wistia embed URL
- **Fallback Support**: If Wistia upload fails, the system falls back to local storage (base64)
- **Admin Dashboard**: Recordings are displayed as embedded Wistia videos in the submission view
- **Progress Indication**: Visual feedback during upload process

## Setup

### 1. Environment Configuration

Add your Wistia API token to your `.env.local` file:

```bash
NEXT_PUBLIC_WISTIA_API_TOKEN=your-wistia-api-token
```

**Current Token**: `f80a7b1114f975a23bb0fe6305651ac16e15773de7e7da737b36898f1385d1ac`

### 2. Wistia API Access

The integration uses the following Wistia endpoints:

- **Upload**: `https://upload.wistia.com`
- **API**: `https://api.wistia.com/v1/medias/`

Documentation: https://wistia.com/support/developers/upload-api

## Architecture

### Files Modified/Created

1. **`src/lib/wistiaService.ts`** (NEW)
   - Core service for Wistia API interactions
   - Handles video upload, metadata retrieval, and deletion
   - Provides helper functions for generating embed URLs

2. **`src/components/tasks/BasicRecordingManager.tsx`** (MODIFIED)
   - Integrated Wistia upload on recording stop
   - Added upload progress indicators
   - Fallback to base64 if Wistia fails

3. **`src/app/test/[testUrl]/page.tsx`** (MODIFIED)
   - Passes candidate name to recording manager
   - Stores Wistia URLs instead of base64 data

4. **`src/app/dashboard/tests/[id]/submissions/[submissionId]/page.tsx`** (MODIFIED)
   - Detects and displays Wistia embeds
   - Maintains backward compatibility with base64/screenshot formats

5. **`env.local.example`** (MODIFIED)
   - Added Wistia configuration template

## How It Works

### Recording Flow

1. **Candidate Starts Test**
   - Candidate provides their name during test start
   - Name is passed to `BasicRecordingManager` component

2. **Recording Process**
   - Candidate grants webcam and screen permissions
   - Clicks "Start Recording" to begin
   - MediaRecorder captures both streams

3. **Upload to Wistia**
   - When candidate clicks "Stop Recording" or submits test:
     - Recording data is converted to Blob
     - Uploaded to Wistia with filename: `webcam-{name}-{timestamp}.webm`
     - Wistia returns embed URL
     - Embed URL stored in submission data

4. **View in Dashboard**
   - Admin views submission
   - System detects Wistia URL (contains 'wistia.net')
   - Displays as embedded iframe player

### Data Structure

**Submission Object**:
```typescript
{
  candidateName: string,
  candidateEmail: string,
  webcamRecording: string,  // Wistia embed URL or base64
  screenRecording: string,  // Wistia embed URL or base64
  // ... other fields
}
```

**Wistia Video Info**:
```typescript
{
  hashedId: string,          // Unique video ID
  embedUrl: string,          // iframe embed URL
  shareUrl: string,          // Shareable link
  thumbnailUrl: string,      // Video thumbnail
  duration: number           // Video duration in seconds
}
```

## Wistia Service API

### `uploadToWistia(blob: Blob, fileName: string, description?: string)`

Uploads a video blob to Wistia.

**Parameters**:
- `blob`: Video blob data
- `fileName`: Name for the video file
- `description`: Optional video description

**Returns**: `WistiaVideoInfo` object

**Example**:
```typescript
const videoInfo = await uploadToWistia(blob, 'webcam-john-2025.webm', 'John Doe Webcam');
console.log(videoInfo.embedUrl); // https://fast.wistia.net/embed/iframe/abc123
```

### `uploadDataURLToWistia(dataUrl: string, fileName: string, description?: string)`

Converts a data URL (base64) to blob and uploads to Wistia.

**Parameters**:
- `dataUrl`: Base64 encoded video data
- `fileName`: Name for the video file
- `description`: Optional video description

**Returns**: `WistiaVideoInfo` object

### `getWistiaVideoInfo(hashedId: string)`

Retrieves video information from Wistia.

**Parameters**:
- `hashedId`: Wistia video hashed ID

**Returns**: `WistiaVideoInfo` object or `null`

### `deleteWistiaVideo(hashedId: string)`

Deletes a video from Wistia.

**Parameters**:
- `hashedId`: Wistia video hashed ID

**Returns**: `boolean` (success/failure)

### `generateWistiaEmbed(hashedId: string, width?: string, height?: string)`

Generates HTML embed code for a Wistia video.

**Parameters**:
- `hashedId`: Wistia video hashed ID
- `width`: Optional width (default: '100%')
- `height`: Optional height (default: '360')

**Returns**: HTML string

## Error Handling

The integration includes multiple fallback mechanisms:

1. **Wistia Upload Failure**
   - If upload fails, system falls back to base64 storage
   - Error logged to console
   - User shown status message

2. **Network Issues**
   - Automatic retry on connection errors
   - Graceful degradation to local storage

3. **API Token Issues**
   - Clear error messages if token is invalid
   - Fallback to local storage continues to work

## Viewing Recordings

### Admin Dashboard

Recordings are displayed in the submission detail page:

**Location**: `/dashboard/tests/[testId]/submissions/[submissionId]`

**Display Logic**:
```typescript
// Detects Wistia URL and shows appropriate player
if (recording.includes('wistia.net')) {
  // Show Wistia iframe embed
} else if (recording.startsWith('data:image')) {
  // Show screenshot
} else {
  // Show local video
}
```

**Embed Size**: 
- Width: 100% (responsive)
- Height: 320px (webcam/screen recordings)

## File Naming Convention

Videos uploaded to Wistia follow this naming pattern:

```
{type}-{candidateName}-{timestamp}.webm

Examples:
- webcam-john-doe-2025-10-14T10-30-45-123Z.webm
- screen-jane-smith-2025-10-14T10-30-45-123Z.webm
```

## Performance Considerations

1. **Upload Size**
   - Webcam: ~250kbps bitrate
   - Screen: ~1Mbps bitrate
   - Average 5-minute recording: ~10-40 MB

2. **Upload Time**
   - Depends on network speed
   - Shows progress indicator to user
   - Prevents submission until upload completes

3. **Storage**
   - Videos stored on Wistia servers
   - No local storage impact (except fallback)
   - Wistia handles CDN and streaming

## Security

1. **API Token**
   - Stored as environment variable
   - Never exposed to client-side logs
   - Included in request headers only

2. **CORS**
   - Wistia API handles CORS automatically
   - No additional configuration needed

3. **Access Control**
   - Only test administrators can view recordings
   - Protected by authentication middleware

## Troubleshooting

### Common Issues

**Issue**: Upload fails with 401 Unauthorized
- **Solution**: Check that `NEXT_PUBLIC_WISTIA_API_TOKEN` is set correctly

**Issue**: Video doesn't display in dashboard
- **Solution**: Check browser console for iframe errors. Verify embed URL format.

**Issue**: Upload takes too long
- **Solution**: Check network speed. Consider reducing recording bitrate.

**Issue**: Fallback to base64 always triggers
- **Solution**: Verify Wistia API token is valid. Check network connectivity.

### Debug Mode

Enable debug logging by adding to console:
```javascript
localStorage.setItem('DEBUG_WISTIA', 'true')
```

## Future Enhancements

Potential improvements for the integration:

1. **Progress Bar**: Show detailed upload progress percentage
2. **Batch Upload**: Upload multiple videos in parallel
3. **Compression**: Compress videos before upload to reduce size
4. **Transcoding**: Let Wistia handle format conversion
5. **Analytics**: Track video view counts and engagement
6. **Thumbnails**: Auto-generate and display video thumbnails
7. **Captions**: Auto-generate captions for accessibility

## Support

- **Wistia Documentation**: https://wistia.com/support/developers
- **Wistia Support**: support@wistia.com
- **API Status**: https://status.wistia.com

## License

This integration is part of the Front-end Developer Test Platform and follows the same license terms.

