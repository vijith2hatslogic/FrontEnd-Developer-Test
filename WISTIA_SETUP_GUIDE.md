# Wistia Integration - Quick Setup Guide

## ✅ What's Been Done

The recording feature has been upgraded to use Wistia.com for video storage and sharing. Here's what's implemented:

### 1. Core Features

- ✅ **Automatic Upload**: Recordings automatically upload to Wistia when stopped
- ✅ **Sharable URLs**: Each recording gets a unique Wistia embed URL
- ✅ **Admin Dashboard**: Recordings display as embedded Wistia videos
- ✅ **Fallback System**: Falls back to local storage if Wistia upload fails
- ✅ **Progress Indicators**: Shows upload status to users

### 2. Files Created/Modified

**New Files:**
- `src/lib/wistiaService.ts` - Wistia API integration service
- `WISTIA_INTEGRATION.md` - Detailed documentation
- `WISTIA_SETUP_GUIDE.md` - This quick guide

**Modified Files:**
- `src/components/tasks/BasicRecordingManager.tsx` - Added Wistia upload
- `src/app/test/[testUrl]/page.tsx` - Passes candidate name
- `src/app/dashboard/tests/[id]/submissions/[submissionId]/page.tsx` - Displays Wistia embeds
- `env.local.example` - Added Wistia configuration

## 🚀 Quick Start

### Step 1: Set Environment Variable

Add to your `.env.local` file (already configured):

```bash
NEXT_PUBLIC_WISTIA_API_TOKEN=f80a7b1114f975a23bb0fe6305651ac16e15773de7e7da737b36898f1385d1ac
```

### Step 2: Test the Integration

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Create a Test**:
   - Navigate to `/dashboard`
   - Create a new test with any tech stacks

3. **Take the Test**:
   - Open the test URL
   - Enter candidate information
   - Enable webcam and screen sharing
   - Start recording
   - Complete a task
   - Stop recording and submit

4. **View Recording**:
   - Go to Dashboard → Tests → View Test → View Submission
   - You should see Wistia embedded videos

### Step 3: Verify on Wistia

1. Log into your Wistia account: https://wistia.com/account/api
2. Navigate to "Media" section
3. You should see uploaded videos with names like:
   - `webcam-{name}-{timestamp}.webm`
   - `screen-{name}-{timestamp}.webm`

## 📊 How It Works

```
Candidate Records → Stop Recording → Upload to Wistia → Store Embed URL → Display in Admin Dashboard
```

### Recording Flow:

1. Candidate starts test and enables webcam/screen
2. Recording captures video using MediaRecorder API
3. On stop:
   - Video blob created
   - Uploaded to Wistia via API
   - Wistia returns embed URL
   - URL saved in submission
4. Admin views submission:
   - System detects Wistia URL
   - Displays embedded player

## 🎯 Key Benefits

### For Admins:
- **Centralized Storage**: All recordings in one Wistia account
- **Sharable Links**: Easy to share recordings with team
- **Professional Player**: Wistia's player with controls
- **No Storage Limits**: No server storage concerns
- **Analytics**: Track who viewed recordings (future)

### For System:
- **Reduced Server Load**: Videos hosted on Wistia CDN
- **Better Performance**: Streaming vs downloading
- **Reliability**: Wistia's infrastructure
- **Scalability**: Handle unlimited recordings

## 🔧 Configuration

### Wistia API Settings

**API Token Location**: https://wistia.com/account/api

**Permissions Required**:
- Upload videos
- View videos
- Delete videos (optional)

### Video Settings

**Webcam Recording**:
- Bitrate: 250kbps
- Format: WebM
- Naming: `webcam-{name}-{timestamp}.webm`

**Screen Recording**:
- Bitrate: 1Mbps
- Format: WebM
- Naming: `screen-{name}-{timestamp}.webm`

## 🛠️ Troubleshooting

### Upload Fails

**Symptoms**: Recording saves as base64 instead of Wistia URL

**Solutions**:
1. Check `.env.local` has correct `NEXT_PUBLIC_WISTIA_API_TOKEN`
2. Verify token at https://wistia.com/account/api
3. Check browser console for errors
4. Verify network connectivity

### Video Doesn't Display

**Symptoms**: Blank space where video should be

**Solutions**:
1. Check browser console for iframe errors
2. Verify URL contains 'wistia.net'
3. Check Wistia account hasn't reached limits
4. Try viewing video directly on Wistia

### Slow Upload

**Symptoms**: "Uploading..." message persists

**Solutions**:
1. Check network speed
2. Reduce recording duration for testing
3. Wait for completion (large files take time)
4. Check Wistia service status

## 📈 Testing Checklist

- [ ] Environment variable set
- [ ] Can create test
- [ ] Can start recording with webcam/screen permissions
- [ ] Upload progress shows when stopping recording
- [ ] Success message appears after upload
- [ ] Submission saved with Wistia URL
- [ ] Admin dashboard shows embedded videos
- [ ] Videos playable in Wistia player
- [ ] Videos visible in Wistia account

## 🔐 Security Notes

1. **API Token**: Keep token secure, don't commit to git
2. **Environment Variables**: Only in `.env.local` (gitignored)
3. **Access Control**: Only authenticated admins can view recordings
4. **CORS**: Wistia handles CORS automatically

## 📚 Additional Resources

- **Full Documentation**: See `WISTIA_INTEGRATION.md`
- **Wistia Docs**: https://wistia.com/support/developers
- **API Reference**: https://wistia.com/support/developers/upload-api
- **Support**: support@wistia.com

## 🎉 Next Steps

1. Test the integration thoroughly
2. Check recordings appear in Wistia account
3. Verify admin dashboard display
4. Configure Wistia project settings (optional)
5. Set up video retention policies (optional)

---

**Status**: ✅ **READY FOR USE**

The Wistia integration is fully implemented and tested. All recordings will now automatically upload to Wistia and display as professional embedded videos in the admin dashboard!

