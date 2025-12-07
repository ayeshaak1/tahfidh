# Railway Backend Deployment Guide

Railway is recommended for backend hosting because it's easy, free to start, and includes PostgreSQL.

## Step 1: Create Railway Account

1. Go to [Railway](https://railway.app/)
2. Sign up with GitHub (recommended)
3. Verify your email

## Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Authorize Railway to access your GitHub
4. Select your repository
5. Railway will detect it's a Node.js project

## Step 3: Configure Project

1. **Set Root Directory:**
   - Go to Settings → Source
   - Set Root Directory to: `backend`

2. **Add PostgreSQL Database:**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway automatically creates a PostgreSQL database
   - Note the connection details (shown in Variables tab)

3. **Set Environment Variables:**
   - Go to Variables tab
   - Add all required variables (see below)

## Step 4: Environment Variables

Add these in Railway's Variables tab:

```env
# Database (Railway provides these automatically, but you can override)
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_SSL=true

# JWT Secret (generate one: node backend/generate-jwt-secret.js)
JWT_SECRET=your-generated-jwt-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-railway-app.up.railway.app/api/auth/google/callback
FRONTEND_URL=https://your-domain.com

# Session Secret (can use same as JWT_SECRET)
SESSION_SECRET=your-session-secret

# Quran API
QURAN_CLIENT_ID=your-quran-client-id
QURAN_CLIENT_SECRET=your-quran-client-secret

# Server
PORT=${{PORT}}
NODE_ENV=production
```

**Note:** Railway automatically provides `${{Postgres.*}}` variables when you add PostgreSQL. Use those for database connection.

## Step 5: Deploy

1. Railway will automatically deploy when you push to GitHub
2. Or click "Deploy" button to deploy immediately
3. Wait for deployment to complete
4. Your backend URL will be: `https://your-app-name.up.railway.app`

## Step 6: Get Custom Domain (Optional)

1. Go to Settings → Networking
2. Click "Generate Domain" or "Custom Domain"
3. Add your custom domain
4. Configure DNS as shown in Railway

## Step 7: Update Frontend

In Netlify, update environment variable:
```
REACT_APP_API_URL=https://your-railway-app.up.railway.app/api
```

## Step 8: Update Google OAuth

In Google Cloud Console:
- Add Railway URL to Authorized JavaScript origins
- Add Railway callback URL to Authorized redirect URIs

## Troubleshooting

**Deployment fails:**
- Check build logs in Railway
- Verify all environment variables are set
- Ensure `package.json` has correct start script

**Database connection fails:**
- Verify PostgreSQL service is running
- Check environment variables match Railway's provided values
- Ensure `DB_SSL=true` for Railway's PostgreSQL

**App not accessible:**
- Check if deployment succeeded
- Verify PORT is set to `${{PORT}}` (Railway provides this)
- Check logs for errors

## Railway Free Tier

- $5 credit per month
- Enough for small to medium apps
- PostgreSQL included
- Automatic HTTPS
- Custom domains supported

## Cost

- **Free tier:** $5/month credit (usually enough for small apps)
- **Paid:** Pay-as-you-go after free credit
- **Database:** Included in free tier

Your backend is now live! 🚀

