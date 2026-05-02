# Render Deployment Troubleshooting Guide

The previous deployment failed, likely due to Dockerfile issues. I've fixed them. Here's how to redeploy and debug:

## What Was Fixed

1. **Dockerfile issue**: Was building the React client unnecessarily (uses Vite, bloats build)
2. **Monorepo structure**: Wasn't properly handling workspace dependencies
3. **Working directory**: Changed the final working directory to work correctly from `/app`

## How to Redeploy

### Option 1: Using Render Dashboard (Recommended)

1. Go to **https://render.com/dashboard**
2. Find your **srms-backend** service (if it exists) → Delete it
3. Go to **https://render.com/blueprints**
4. Click "New Blueprint Instance"
5. Paste repo URL: `https://github.com/Kalpit0710/res-try.git`
6. Click "Connect"
7. When it auto-detects `render.yaml`, click "Create Blueprint Instance"
8. **IMPORTANT**: When prompted for environment variables:
   - **MONGO_URI**: Paste your MongoDB Atlas connection string
     - Get from: MongoDB Atlas → Cluster → Connect → Copy connection string
     - Format: `mongodb+srv://username:password@cluster.mongodb.net/srms`
   - **CLIENT_URL**: `https://client-jade-iota.vercel.app`
   - Leave other values as-is
9. Click "Create Blueprint"
10. Wait 5-10 minutes for deployment

### Option 2: Manual Service Creation (If Blueprint Doesn't Work)

1. Go to **https://render.com** → "New +" → "Web Service"
2. Connect your GitHub repo: `Kalpit0710/res-try`
3. Select "main" branch
4. Configure:
   - **Name**: `srms-backend`
   - **Runtime**: `Docker`
   - **Build Command**: (leave empty - Docker builds automatically)
   - **Start Command**: (leave empty - uses Dockerfile CMD)
5. Add environment variables:
   ```
   PORT=5000
   NODE_ENV=production
   PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
   MONGO_URI=<your-mongodb-atlas-connection-string>
   JWT_SECRET=<any-long-random-string>
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=Admin@1234
   SCHOOL_NAME=J. R. Preparatory School
   ACADEMIC_SESSION=2025-26
   CLIENT_URL=https://client-jade-iota.vercel.app
   ```
6. Click "Create Web Service"
7. Wait for deployment

## Debugging Failed Deployments

### Check Build Logs

1. Go to your Render service dashboard
2. Click "Logs" tab
3. Look for error messages in the output

### Common Errors & Solutions

#### Error: "cannot find module @srms/shared"
- **Cause**: Node modules weren't installed properly
- **Fix**: Ensure `npm ci` runs in both build stages
- Already fixed in the new Dockerfile ✅

#### Error: "chromium not found"
- **Cause**: Alpine Linux didn't install chromium package
- **Fix**: The Dockerfile now uses `apk add chromium`
- Already fixed ✅

#### Error: "MONGO_URI is not defined"
- **Cause**: You didn't paste the MongoDB connection string
- **Fix**: Go to your Render service settings → Environment Variables
  - Add `MONGO_URI` with your actual MongoDB Atlas connection string
  - Redeploy

#### Error: "connect ECONNREFUSED"
- **Cause**: Server can't reach MongoDB
- **Fix**: 
  1. Verify MongoDB Atlas connection string is correct
  2. Check IP whitelist in MongoDB Atlas → Network Access
  3. Allow 0.0.0.0/0 (or Render's IP range)
  4. Ensure database user password is correct

#### Error: "memory exceeded" or "disk space"
- **Cause**: Build is too large
- **Fix**: The new Dockerfile is smaller (only builds backend, not client)
- Already optimized ✅

## Testing After Deployment

Once deployed successfully:

1. **Test health check**:
   - Visit: `https://srms-backend-xxx.onrender.com/health`
   - Should return: `{"status":"ok","ts":"..."}`

2. **Test frontend connection**:
   - Visit: `https://client-jade-iota.vercel.app`
   - Try to login with `admin` / `Admin@1234`
   - If you see "Connection refused", check `VITE_API_URL` on Vercel

3. **Test PDF generation** (if login works):
   - Create or query a student
   - Try to generate report PDF
   - If PDF fails, the Puppeteer setup isn't working

## Still Failing?

If deployment still fails:

1. **Get exact error**:
   - Share the error from Render logs (screenshot or paste)
   
2. **Check these files**:
   - Dockerfile: Should be in repo root (`/Dockerfile`)
   - render.yaml: Should be in repo root (`/render.yaml`)
   - package.json: Should have `build:server` and `build:shared` scripts

3. **Verify scripts exist**:
   ```bash
   npm run build:server   # Should work locally
   npm run build:shared   # Should work locally
   ```

## MongoDB Atlas Connection String Format

Your connection string should look like this:

```
mongodb+srv://admin123:MyPassword@cluster0.abc123.mongodb.net/srms?retryWrites=true&w=majority
```

Breaking it down:
- `admin123` = your database user
- `MyPassword` = your database password (NOT your Atlas account password)
- `cluster0.abc123` = your cluster name
- `srms` = database name

**Common mistake**: Using Atlas account password instead of database user password → Connection fails!

---

**Next**: After successful deployment, we can:
- Set up automatic redeploys on git push
- Configure monitoring and logs
- Test full end-to-end workflow
