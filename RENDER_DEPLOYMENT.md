# Render Backend Deployment Guide

Render is another great option for free backend hosting with PostgreSQL included.

## Step 1: Create Render Account

1. Go to [Render](https://render.com/)
2. Sign up with GitHub (recommended)
3. Verify your email

## Step 2: Create Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select your repository
4. Configure:
   - **Name:** tahfidh-backend (or your choice)
   - **Environment:** Node
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Root Directory:** (leave empty, or set to `backend`)

## Step 3: Add PostgreSQL Database

1. Click "New +" → "PostgreSQL"
2. Configure:
   - **Name:** tahfidh-db
   - **Database:** tahfidh
   - **User:** (auto-generated)
   - **Region:** Choose closest to you
3. Click "Create Database"
4. Note the connection details (shown in dashboard)

## Step 4: Link Database to Web Service

1. Go to your Web Service
2. Go to "Environment" tab
3. Click "Link Database"
4. Select your PostgreSQL database
5. Render automatically adds database environment variables

## Step 5: Set Environment Variables

In your Web Service → Environment tab, add:

```env
# Database (Render provides these when you link database)
DATABASE_URL=${{postgres.DATABASE_URL}}
DB_HOST=${{postgres.HOST}}
DB_PORT=${{postgres.PORT}}
DB_NAME=${{postgres.DATABASE}}
DB_USER=${{postgres.USER}}
DB_PASSWORD=${{postgres.PASSWORD}}
DB_SSL=true

# JWT Secret
JWT_SECRET=your-generated-jwt-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-app.onrender.com/api/auth/google/callback
FRONTEND_URL=https://your-domain.com

# Session Secret
SESSION_SECRET=your-session-secret

# Quran API
QURAN_CLIENT_ID=your-quran-client-id
QURAN_CLIENT_SECRET=your-quran-client-secret

# Server
PORT=${{PORT}}
NODE_ENV=production
```

## Step 6: Deploy

1. Render will automatically deploy
2. First deployment may take 5-10 minutes
3. Your backend URL: `https://your-app-name.onrender.com`

## Step 7: Update Frontend

In Netlify:
```
REACT_APP_API_URL=https://your-app-name.onrender.com/api
```

## Step 8: Update Google OAuth

In Google Cloud Console:
- Add Render URL to Authorized JavaScript origins
- Add Render callback URL to Authorized redirect URIs

## Important: Free Tier Limitations

**Render Free Tier:**
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds (cold start)
- 750 hours/month free (enough for always-on if single service)

**Solutions:**
1. Use Render's paid tier ($7/month) for always-on
2. Use a cron job to ping your service every 10 minutes
3. Accept the cold start (users wait ~30 seconds first time)

## Troubleshooting

**Service won't start:**
- Check build logs
- Verify start command is correct
- Ensure all dependencies are in package.json

**Database connection fails:**
- Verify database is linked to web service
- Check environment variables
- Ensure DB_SSL=true

**Cold start issues:**
- This is normal on free tier
- Consider upgrading to paid tier
- Or use a cron service to keep it warm

## Cost

- **Free tier:** 750 hours/month (enough for always-on single service)
- **Paid tier:** $7/month for always-on + no cold starts
- **Database:** Free PostgreSQL included

Your backend is now live on Render! 🚀

