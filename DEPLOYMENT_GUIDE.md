# Deployment Guide - Netlify + Custom Domain

This guide will help you deploy your Tahfidh app to Netlify with a custom domain.

## Part 1: Get a Domain

### Option 1: Free Domain (Recommended for Testing)
- **Freenom** (https://www.freenom.com/) - Free .tk, .ml, .ga domains
- **No-IP** (https://www.noip.com/) - Free dynamic DNS
- **Note:** Free domains may have limitations, but work fine for personal projects

### Option 2: Cheap Domain (Recommended for Production)
- **Namecheap** (https://www.namecheap.com/) - ~$10-15/year for .com domains
- **Google Domains** (https://domains.google/) - ~$12/year for .com
- **Cloudflare Registrar** (https://www.cloudflare.com/products/registrar/) - At-cost pricing (~$8-10/year)
- **Porkbun** (https://porkbun.com/) - Competitive pricing

### Option 3: Domain Included with Services
- Some hosting services offer free domains with annual plans
- Check if your hosting provider includes a domain

## Part 2: Frontend Deployment (Netlify)

### Step 1: Prepare Your Frontend

1. **Build your React app:**
   ```bash
   npm run build
   ```
   This creates a `build` folder with production-ready files.

2. **Create Netlify configuration** (already created - see `netlify.toml`)

3. **Set up environment variables:**
   - Go to Netlify dashboard → Your site → Site settings → Environment variables
   - Add:
     ```
     REACT_APP_API_URL=https://your-backend-url.com/api
     ```

### Step 2: Deploy to Netlify

**Option A: Deploy via Git (Recommended)**
1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Netlify](https://www.netlify.com/)
3. Click "Add new site" → "Import an existing project"
4. Connect your Git repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
6. Click "Deploy site"

**Option B: Deploy via Netlify CLI**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
npm run build
netlify deploy --prod
```

**Option C: Drag & Drop**
1. Build your app: `npm run build`
2. Go to Netlify dashboard
3. Drag the `build` folder to Netlify
4. Your site is live!

### Step 3: Add Custom Domain

1. **In Netlify Dashboard:**
   - Go to Site settings → Domain management
   - Click "Add custom domain"
   - Enter your domain (e.g., `tahfidh.com`)

2. **Configure DNS:**
   - Netlify will show you DNS records to add
   - Go to your domain registrar (where you bought the domain)
   - Add these DNS records:
     - **Type:** A or CNAME
     - **Name:** @ (or www)
     - **Value:** Netlify's IP or domain (shown in Netlify)
   - Wait for DNS propagation (5 minutes to 48 hours)

3. **Enable HTTPS:**
   - Netlify automatically provisions SSL certificates via Let's Encrypt
   - HTTPS will be enabled automatically once DNS is configured

## Part 3: Backend Deployment

**Important:** Netlify only hosts static sites. Your backend needs separate hosting.

### Recommended Free Backend Hosting:

**Option 1: Railway (Recommended)**
- Free tier: $5 credit/month
- Easy PostgreSQL setup
- Automatic deployments from Git
- **Setup:**
  1. Go to [Railway](https://railway.app/)
  2. New Project → Deploy from GitHub
  3. Select your backend folder
  4. Add environment variables
  5. Add PostgreSQL database
  6. Deploy!

**Option 2: Render**
- Free tier available
- PostgreSQL included
- **Setup:**
  1. Go to [Render](https://render.com/)
  2. New Web Service → Connect GitHub
  3. Select backend folder
  4. Add environment variables
  5. Add PostgreSQL database
  6. Deploy!

**Option 3: Fly.io**
- Free tier available
- Good for Node.js apps
- **Setup:**
  1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
  2. `fly launch` in backend directory
  3. Follow prompts
  4. Deploy!

**Option 4: Heroku (Limited Free Tier)**
- Free tier is limited but works
- **Setup:**
  1. Create Heroku account
  2. Install Heroku CLI
  3. `heroku create your-app-name`
  4. `git push heroku main`
  5. Add PostgreSQL addon

### Backend Environment Variables

Set these in your backend hosting platform:

```env
# Database (use hosted PostgreSQL from your platform)
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_SSL=true

# JWT Secret
JWT_SECRET=your-jwt-secret

# Google OAuth (update with production URLs)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-backend-url.com/api/auth/google/callback
FRONTEND_URL=https://your-domain.com

# Session Secret
SESSION_SECRET=your-session-secret

# Quran API (your existing credentials)
QURAN_CLIENT_ID=your-quran-client-id
QURAN_CLIENT_SECRET=your-quran-client-secret

# Server
PORT=5000
NODE_ENV=production
```

## Part 4: Update Google OAuth for Production

1. **Go to Google Cloud Console:**
   - APIs & Services → Credentials
   - Edit your OAuth 2.0 Client ID

2. **Update Authorized JavaScript origins:**
   - Add: `https://your-domain.com`
   - Add: `https://www.your-domain.com` (if using www)

3. **Update Authorized redirect URIs:**
   - Add: `https://your-backend-url.com/api/auth/google/callback`

4. **Publish your app** (if not already):
   - OAuth consent screen → Publish App

## Part 5: Update Frontend Environment Variables

In Netlify dashboard:
- Site settings → Environment variables
- Update:
  ```
  REACT_APP_API_URL=https://your-backend-url.com/api
  ```

## Part 6: Database Setup

### Using Railway/Render PostgreSQL:

1. **Create PostgreSQL database** in your hosting platform
2. **Get connection string** from platform dashboard
3. **Update backend environment variables** with database credentials
4. **Database tables will auto-create** when backend starts

### Manual Database Setup (if needed):

```sql
-- Connect to your hosted PostgreSQL
-- Tables will be created automatically, but you can verify:

SELECT * FROM users;
SELECT * FROM user_progress;
```

## Part 7: Testing Production

1. **Test frontend:**
   - Visit `https://your-domain.com`
   - Should load your app

2. **Test backend:**
   - Visit `https://your-backend-url.com/api/health`
   - Should return: `{"status":"OK"}`

3. **Test authentication:**
   - Try signing up with email
   - Try Google OAuth
   - Verify database is storing users

## Troubleshooting

### Frontend Issues

**Build fails:**
- Check build logs in Netlify
- Ensure all dependencies are in `package.json`
- Check for environment variable errors

**API calls fail:**
- Verify `REACT_APP_API_URL` is set correctly
- Check CORS settings in backend
- Verify backend is running

### Backend Issues

**Database connection fails:**
- Verify database credentials
- Check if database is accessible from hosting platform
- Ensure `DB_SSL=true` for hosted databases

**OAuth redirect fails:**
- Verify callback URL matches exactly in Google Console
- Check backend URL is correct
- Ensure HTTPS is enabled

### DNS Issues

**Domain not resolving:**
- Wait for DNS propagation (can take up to 48 hours)
- Check DNS records are correct
- Use `dig your-domain.com` or `nslookup your-domain.com` to verify

**HTTPS not working:**
- Netlify automatically provisions SSL
- Wait for DNS to propagate
- Check SSL status in Netlify dashboard

## Quick Checklist

- [ ] Domain purchased/configured
- [ ] Frontend deployed to Netlify
- [ ] Custom domain added to Netlify
- [ ] Backend deployed to hosting platform
- [ ] PostgreSQL database created
- [ ] Environment variables set in both frontend and backend
- [ ] Google OAuth updated with production URLs
- [ ] DNS records configured
- [ ] HTTPS enabled (automatic on Netlify)
- [ ] Tested sign up/sign in
- [ ] Tested Google OAuth

## Cost Breakdown

**Free Option:**
- Domain: Free (Freenom) or ~$10/year (Namecheap)
- Frontend: Free (Netlify)
- Backend: Free (Railway/Render free tier)
- Database: Included with backend hosting
- **Total: $0-10/year**

**Recommended Production:**
- Domain: ~$10-15/year
- Frontend: Free (Netlify)
- Backend: ~$5-10/month (Railway/Render paid tier)
- Database: Included
- **Total: ~$70-135/year**

## Next Steps

1. Choose and purchase domain
2. Deploy frontend to Netlify
3. Deploy backend to Railway/Render
4. Configure DNS
5. Update environment variables
6. Test everything!

Your app will be live and accessible to everyone! 🚀

