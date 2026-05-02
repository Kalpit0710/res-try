# Backend Deployment Guide: Render

This guide walks you through deploying the SRMS backend to Render with full PDF generation support.

## Prerequisites

1. **GitHub account** with the `res-try` repository
2. **Render account** (free tier: https://render.com)
3. **MongoDB Atlas account** (free tier: https://www.mongodb.com/cloud/atlas)

## Step 1: Create MongoDB Atlas Database

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign in or create a free account
3. Create a new M0 cluster (free tier)
4. Set a username and password for database access
5. Whitelist your IP (or allow 0.0.0.0/0 for testing)
6. Click "Connect" and copy the connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/srms`
   - Replace `<password>` with your actual password
   - The database name `srms` is auto-created

Save this connection string for Step 3.

## Step 2: Connect Render to Your GitHub Repository

1. Go to https://render.com and sign in
2. Click "New +" → "Blueprint"
3. Select "Public Git Repository"
4. Paste your repository URL: `https://github.com/Kalpit0710/res-try.git`
5. Click "Connect"

## Step 3: Deploy Using render.yaml

1. Render will auto-detect the `render.yaml` file in your repo
2. Click "Create New Blueprint Instance"
3. Give it a name (e.g., "srms-backend")
4. Review the services:
   - **srms-backend** (Web service with Docker)
   - **srms-db** (MongoDB instance)

## Step 4: Configure Environment Variables

Before deploying, Render will show you the environment variables from `render.yaml`:

1. **Update these critical variables:**
   - `MONGO_URI`: Leave as-is (auto-configured to link to `srms-db`)
   - `JWT_SECRET`: Keep the auto-generated value
   - `CLIENT_URL`: Update to `https://client-jade-iota.vercel.app` (your Vercel frontend URL)

2. **Optional updates:**
   - `ADMIN_USERNAME`: Change if desired
   - `ADMIN_PASSWORD`: Change if desired
   - `SCHOOL_NAME`: Update to your school name
   - `ACADEMIC_SESSION`: Update to current session

3. Click "Create Blueprint" to deploy

## Step 5: Wait for Deployment

The deployment will take ~5–10 minutes:
- Docker image builds on Render's infrastructure
- Chromium and dependencies are installed
- Server starts and connects to MongoDB

You'll see a green checkmark when complete.

## Step 6: Get Your Backend URL

Once deployed:
1. Click on the **srms-backend** service in the Blueprint
2. Copy the URL from the top (e.g., `https://srms-backend-xxx.onrender.com`)
3. Test it by visiting: `https://srms-backend-xxx.onrender.com/health`
   - Should return: `{"status":"ok","ts":"2026-05-02T..."}`

## Step 7: Update Vercel Frontend Environment Variable

1. Go to https://vercel.com → Your Projects → **client**
2. Go to Settings → Environment Variables
3. Add or update:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://srms-backend-xxx.onrender.com/api/v1` (use your actual backend URL)
4. Save and redeploy

## Step 8: Test End-to-End

1. Visit your frontend: https://client-jade-iota.vercel.app
2. Login with:
   - Username: `admin`
   - Password: `Admin@1234`
3. Create a student or use seeded data
4. Generate a PDF report to verify Chrome/Puppeteer works

## Troubleshooting

### "Build failed" or "container failed to start"

- Check the logs in Render dashboard
- Ensure `Dockerfile` and `render.yaml` are in the root directory
- Verify Docker builds locally: `docker build -t srms:test .`

### "Chromium not found" or PDF generation fails

- The `Dockerfile` installs `chromium-browser` automatically
- Verify the build logs show: `chromium` installed
- Ensure `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser` is set

### MongoDB connection fails

- Verify connection string in `MONGO_URI` is correct
- Ensure IP whitelist includes 0.0.0.0/0 (or your Render IP)
- Check database username and password are correct

### Frontend returns 403 CORS errors

- Update `CLIENT_URL` on Render to match your Vercel frontend URL
- Redeploy the backend

## Costs

- **Render free tier**: 750 hours/month (enough for one service running continuously)
- **MongoDB Atlas free tier**: M0 cluster (512 MB storage, perfect for testing)
- **Vercel free tier**: Unlimited static deployments

Total: **$0** if using only free tiers.

## Next Steps

After successful deployment:
1. Populate the database with seed data: Contact admin for seeding script
2. Upload school logo and principal signature in Settings
3. Share the frontend URL with users
4. Monitor backend logs on Render dashboard

---

**Questions?** Check the Render docs: https://render.com/docs
