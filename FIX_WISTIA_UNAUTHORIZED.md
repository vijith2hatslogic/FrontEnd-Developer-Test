# 🔴 FIX: Wistia Upload Failed - Unauthorized

## Error Message
```
Wistia upload failed: Unauthorized
```

## Root Cause

The Wistia API token is not being recognized. This happens when:

1. ❌ Server not restarted after adding `.env.local`
2. ❌ Token not in `.env.local` file
3. ❌ Wrong token format
4. ❌ Token doesn't have upload permissions

## ✅ IMMEDIATE FIX

### Step 1: Verify Token in .env.local

```bash
cd /Users/2hatslogic/Documents/Front-end\ Developer\ Machine\ Test/frontend-dev-test

# Check if token exists
grep NEXT_PUBLIC_WISTIA_API_TOKEN .env.local
```

**Should show:**
```
NEXT_PUBLIC_WISTIA_API_TOKEN=f80a7b1114f975a23bb0fe6305651ac16e15773de7e7da737b36898f1385d1ac
```

**If missing, add it:**
```bash
echo "NEXT_PUBLIC_WISTIA_API_TOKEN=f80a7b1114f975a23bb0fe6305651ac16e15773de7e7da737b36898f1385d1ac" >> .env.local
```

### Step 2: ⚠️ RESTART SERVER (CRITICAL!)

```bash
# Press Ctrl+C to stop the server
# Then restart:
npm run dev
```

**⚡ This is the most common fix!** Environment variables are only loaded when the server starts.

### Step 3: Test Upload

1. Open browser with DevTools (F12) → Console
2. Create a test and start recording
3. Stop recording
4. Watch console for:

**Expected (Success):**
```javascript
[Wistia] Upload attempt: {
  fileName: "webcam-...",
  blobSize: 12345,
  hasToken: true,  ← Must be true!
  tokenLength: 72,  ← Must be > 0!
  tokenPreview: "f80a7b1114..."
}

[Wistia] Upload response: {
  status: 200,  ← Must be 200!
  statusText: "OK",
  ok: true
}

Wistia webcam upload successful: { ... }
```

**Error (Still Failing):**
```javascript
[Wistia] Upload attempt: {
  hasToken: false,  ← Problem!
  tokenLength: 0,  ← Problem!
  tokenPreview: "MISSING"  ← Problem!
}
```

If you see `hasToken: false`, the server didn't reload the env variable!

## 🔍 Detailed Troubleshooting

### Issue 1: Token Not Loaded

**Symptoms:**
```
hasToken: false
tokenPreview: "MISSING"
```

**Solutions:**

**A. Server Not Restarted**
```bash
# Stop server (Ctrl+C)
npm run dev
```

**B. Wrong File Name**
Make sure it's `.env.local` (not `.env` or `env.local`)

**C. Check File Content**
```bash
cat .env.local | grep WISTIA
```

Should output:
```
NEXT_PUBLIC_WISTIA_API_TOKEN=f80a7b1114f975a23bb0fe6305651ac16e15773de7e7da737b36898f1385d1ac
```

**D. Verify Environment Variable at Runtime**

Add this temporarily to test:
```typescript
// In src/app/test/[testUrl]/page.tsx
console.log('ENV CHECK:', {
  hasToken: !!process.env.NEXT_PUBLIC_WISTIA_API_TOKEN,
  tokenPreview: process.env.NEXT_PUBLIC_WISTIA_API_TOKEN?.substring(0, 10)
});
```

### Issue 2: Token is Invalid

**Symptoms:**
```
hasToken: true
tokenLength: 72
But still gets: Unauthorized (401)
```

**Possible Causes:**

**A. Wrong Token**
- Verify token at: https://wistia.com/account/api
- Copy the correct API token
- Make sure there are no extra spaces

**B. Token Expired**
- Wistia tokens can expire
- Generate a new one if needed

**C. Token Permissions**
- Token must have "Upload" permission
- Check token settings in Wistia dashboard

**Fix:**
1. Go to https://wistia.com/account/api
2. Click "Generate new API access token"
3. Copy the token
4. Update `.env.local`:
   ```bash
   # Replace with your NEW token
   NEXT_PUBLIC_WISTIA_API_TOKEN=your-new-token-here
   ```
5. Restart server!

### Issue 3: CORS or Network Error

**Symptoms:**
```
Network Error
CORS policy blocked
```

**This is rare with Wistia** but if it happens:

1. Check internet connection
2. Try different network
3. Check browser console for CORS errors
4. Disable browser extensions

### Issue 4: Blob is Empty

**Symptoms:**
```
blobSize: 0
```

**Cause:** Recording didn't capture any data

**Fix:**
- Make sure camera/screen permissions granted
- Check if MediaRecorder is supported (use Chrome)
- Try recording for longer (at least 2-3 seconds)

## 🧪 Test Token Directly

Create a test file to verify token works:

```html
<!-- test-wistia-token.html -->
<!DOCTYPE html>
<html>
<head><title>Test Wistia Token</title></head>
<body>
  <h1>Test Wistia Token</h1>
  <button onclick="testToken()">Test Token</button>
  <pre id="result"></pre>

  <script>
    async function testToken() {
      const token = 'f80a7b1114f975a23bb0fe6305651ac16e15773de7e7da737b36898f1385d1ac';
      
      try {
        document.getElementById('result').textContent = 'Testing token...';
        
        const response = await fetch('https://api.wistia.com/v1/medias.json', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          document.getElementById('result').textContent = 
            '✅ TOKEN WORKS!\n\n' + JSON.stringify(data, null, 2);
        } else {
          document.getElementById('result').textContent = 
            '❌ TOKEN FAILED!\n' +
            'Status: ' + response.status + '\n' +
            'Error: ' + response.statusText;
        }
      } catch (err) {
        document.getElementById('result').textContent = 
          '❌ ERROR!\n' + err.message;
      }
    }
  </script>
</body>
</html>
```

Save this file and open in browser. Click "Test Token".

**Expected:**
```
✅ TOKEN WORKS!
```

**If Failed:**
- Token is invalid
- Get a new token from Wistia

## 📝 Complete Fix Checklist

- [ ] Verify `.env.local` exists
- [ ] Token is in `.env.local` with correct variable name
- [ ] Token value is complete (no spaces/newlines)
- [ ] Server restarted after adding token
- [ ] Console shows `hasToken: true`
- [ ] Console shows `tokenLength: 72` (or similar)
- [ ] Test token directly (HTML test above)
- [ ] Create new test submission
- [ ] Check console for success messages

## 🎯 Quick Command Summary

```bash
# 1. Check token
grep NEXT_PUBLIC_WISTIA_API_TOKEN .env.local

# 2. If missing, add it
echo 'NEXT_PUBLIC_WISTIA_API_TOKEN=f80a7b1114f975a23bb0fe6305651ac16e15773de7e7da737b36898f1385d1ac' >> .env.local

# 3. Restart server (CRITICAL!)
# Press Ctrl+C
npm run dev

# 4. Test in browser
# F12 → Console → Create test → Record → Check logs
```

## ✅ Success Indicators

You'll know it's fixed when:

1. **Console shows:**
   ```
   [Wistia] Upload attempt: { hasToken: true, tokenLength: 72 }
   [Wistia] Upload response: { status: 200, ok: true }
   Wistia webcam upload successful: { ... }
   ```

2. **No more "Unauthorized" errors**

3. **Videos appear in Wistia dashboard**

4. **Database has share URLs (not NULL)**

---

**90% of the time, the fix is: Restart the server!** 🔄

The server caches environment variables and won't pick up new ones until restarted.

