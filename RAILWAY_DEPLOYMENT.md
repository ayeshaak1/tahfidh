# Deploy Backend to Railway (Render Alternative)

Use this guide to deploy your Tahfidh backend to **Railway** instead of Render. Keep your frontend on Netlify and everything else the same—only the backend host changes.

## Why Railway?

- **Free tier**: $5 free credit monthly (enough for small apps)
- **No spin-down**: Services stay warm (unlike Render free tier)
- **Simple setup**: PostgreSQL + Node.js in one place
- **GitHub deploys**: Auto-deploy on push

---

## Prerequisites

- GitHub repo pushed and up to date
- Existing secrets: JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, QURAN_CLIENT_ID, QURAN_CLIENT_SECRET
- Netlify frontend URL (for FRONTEND_URL and CORS)

---

## Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in with **GitHub**
2. Click **"New Project"**
3. Choose **"Deploy from GitHub repo"**
4. Select your repository
5. Railway will create a project and attempt to deploy (we’ll configure it next)

---

## Step 2: Configure the Backend Service

1. Click the new **service** (your repo name)
2. Open **Settings** → **General**
3. Set **Root Directory** to: `backend`
4. Railway will redeploy using the `backend` folder

**Build & Deploy** (usually auto-detected):

- **Build Command**: `npm install` (or leave default)
- **Start Command**: `npm start` (or leave default)
- **Watch Paths**: leave default for `backend/`

---

## Step 3: Add PostgreSQL Database

1. In your project, click **"+ New"**
2. Choose **"Database"** → **"Add PostgreSQL"**
3. Railway creates a PostgreSQL instance
4. **Connect the database to your backend:**
   - Open **tahfidh-backend** → **Variables**
   - Click **"+ New Variable"** or **"Add Variable"**
   - **Option A (Reference):** Use `${{tahfidh-db.DATABASE_URL}}` as the value for variable `DATABASE_URL` (replace `tahfidh-db` with your actual database service name)
   - **Option B (Manual copy):** In **tahfidh-db** → Variables, copy the `DATABASE_URL` value. In **tahfidh-backend** → Variables, create `DATABASE_URL` and paste the value
5. Ensure both services are in the **same environment** (e.g. Production)

No extra DB config needed; the backend supports `DATABASE_URL` automatically.

---

## Step 4: Set Environment Variables

In the backend service → **Variables**, add or edit:

**Required:**

| Variable       | Value                                |
|----------------|--------------------------------------|
| `NODE_ENV`     | `production`                         |
| `FRONTEND_URL` | `https://your-app.netlify.app`       |
| `JWT_SECRET`   | _(your generated JWT secret)_        |
| `SESSION_SECRET` | _(same as JWT_SECRET or new value)_ |

**Google OAuth:**

| Variable             | Value                    |
|----------------------|--------------------------|
| `GOOGLE_CLIENT_ID`   | _(from Google Console)_  |
| `GOOGLE_CLIENT_SECRET` | _(from Google Console)_ |

**Quran API:**

| Variable             | Value                   |
|----------------------|-------------------------|
| `QURAN_CLIENT_ID`    | _(production client id)_|
| `QURAN_CLIENT_SECRET`| _(production secret)_   |

**Google OAuth callback** (use your Railway backend URL, not Render):

| Variable             | Value                                                       |
|----------------------|-------------------------------------------------------------|
| `GOOGLE_CALLBACK_URL`| `https://YOUR-RAILWAY-DOMAIN.up.railway.app/api/auth/google/callback` |

Replace `YOUR-RAILWAY-DOMAIN` with your actual domain from Step 5 (e.g. `tahfidh-backend-production`).

**Optional (if not using Railway PostgreSQL):**

If you use an external DB instead of Railway’s PostgreSQL, set:

| Variable     | Value        |
|-------------|--------------|
| `DB_HOST`   | _host_       |
| `DB_PORT`   | `5432`       |
| `DB_NAME`   | _database_   |
| `DB_USER`   | _user_       |
| `DB_PASSWORD` | _password_ |
| `DB_SSL`    | `true`       |

`PORT` is set by Railway; you don’t need to add it.

---

## Step 5: Generate a Public URL

1. In your backend service, go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL, e.g. `https://tahfidh-backend-production-xxxx.up.railway.app`

---

## Step 6: Update Netlify Frontend

1. In Netlify → **Site settings** → **Environment variables**
2. Set or update:
   ```
   REACT_APP_API_URL = https://your-railway-url.up.railway.app/api
   ```
   (Use the URL from Step 5, with `/api` at the end)
3. Trigger a new deploy so the new API URL is used

---

## Step 7: Update Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. Open your OAuth 2.0 Client ID
3. **Authorized JavaScript origins** – add:
   ```
   https://your-railway-url.up.railway.app
   https://your-app.netlify.app
   ```
4. **Authorized redirect URIs** – add:
   ```
   https://your-railway-url.up.railway.app/api/auth/google/callback
   ```
5. Save changes

---

## Step 8: Update Backend FRONTEND_URL (if needed)

1. In Railway → backend service → **Variables**
2. Ensure `FRONTEND_URL` = `https://your-app.netlify.app` (no trailing slash)

---

## Verify Deployment

1. Visit: `https://your-railway-url.up.railway.app/api/surahs`
2. You should get JSON (list of surahs)
3. Test sign in with Google from your Netlify app

---

## Migration from Render

If you were on Render:

1. Use the same `JWT_SECRET`, `SESSION_SECRET`, OAuth, and Quran credentials
2. **Database:** Use Railway PostgreSQL (new DB) or point `DB_*` vars to an existing Postgres (e.g. Neon, Supabase) if you want to keep data
3. Export data from Render DB if needed, then import into the new DB
4. Update Netlify `REACT_APP_API_URL` and Google OAuth redirect URIs as above

---

## Troubleshooting

**"JWT_SECRET is not set"**  
→ Add `JWT_SECRET` in Railway Variables and redeploy.

**"ECONNREFUSED 127.0.0.1:5432"** (connects to localhost instead of Railway DB)  
→ `DATABASE_URL` is not reaching the backend. Fix it:
1. Go to **tahfidh-db** → **Variables** → copy the `DATABASE_URL` value (click to reveal)
2. Go to **tahfidh-backend** → **Variables** → add `DATABASE_URL` and paste the value
3. Redeploy the backend. Use `DATABASE_URL` (private) not `DATABASE_PUBLIC_URL` to avoid egress fees.

**Database connection fails (other)**  
→ With Railway PostgreSQL, ensure `DATABASE_URL` exists. With external DB, confirm `DB_*` vars and `DB_SSL=true`.

**OAuth redirect mismatch**  
→ Google redirect URI must exactly match  
`https://your-railway-url.up.railway.app/api/auth/google/callback`.

**CORS errors**  
→ Confirm `FRONTEND_URL` matches your Netlify URL.

---

## Summary

- Backend: Railway  
- Frontend: Netlify (unchanged)  
- Database: Railway PostgreSQL or external Postgres  
- OAuth and Quran API: same credentials, updated origins/redirect URIs
