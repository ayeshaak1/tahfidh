# Next Steps - Get Your App Running

## ✅ What You've Done
- [x] Google OAuth credentials configured
- [x] JWT secret generated
- [x] Environment variables set up

## 🚀 Next Steps

### Step 1: Set Up PostgreSQL Database

**If you don't have PostgreSQL installed:**
1. Download from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for the `postgres` user

**Create the database:**
```bash
# Open PostgreSQL command line (search "SQL Shell" in Windows)
# Or use pgAdmin (GUI tool that comes with PostgreSQL)

# Connect to PostgreSQL (press Enter for defaults, enter your password)
psql -U postgres

# Create database
CREATE DATABASE tahfidh;

# Exit
\q
```

**Update your `.env` file:**
- Open `backend/.env`
- Set `DB_PASSWORD` to your PostgreSQL password

### Step 2: Install Dependencies

```bash
# Install all dependencies (frontend + backend)
npm run install:all
```

### Step 3: Start the App

**Terminal 1 - Backend:**
```bash
npm run backend
```

**Terminal 2 - Frontend:**
```bash
npm start
```

### Step 4: Test Everything

1. **Open browser:** `http://localhost:3000`
2. **Test email signup:**
   - Click "Start Journey" → "Sign Up"
   - Create an account with email/password
   - Should redirect to onboarding
3. **Test Google OAuth:**
   - Click "Continue with Google"
   - Sign in with Google
   - Should redirect to onboarding
4. **Test onboarding:**
   - Select some surahs you've memorized
   - Click "Continue"
   - Should redirect to dashboard
5. **Test dashboard:**
   - Should show your progress
   - Should show selected surahs

### Step 5: Publish Google OAuth App (Important!)

To allow ALL Google users to sign in (not just test users):

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** → **OAuth consent screen**
3. Click **"PUBLISH APP"** button at the top
4. Confirm the action
5. Status changes from "Testing" to "In production"

**Note:** Users will see a warning screen (this is normal and acceptable for apps using basic scopes).

## 🐛 Troubleshooting

### Backend won't start
- **Check:** Is PostgreSQL running?
  - Windows: Check Services → PostgreSQL
  - Start it if it's not running
- **Check:** Is `DB_PASSWORD` correct in `.env`?
- **Check:** Does database `tahfidh` exist?

### Database connection error
- Verify PostgreSQL is installed and running
- Check password in `backend/.env` matches your PostgreSQL password
- Try creating database again: `CREATE DATABASE tahfidh;`

### Google OAuth not working
- Check credentials are in `backend/.env`
- Verify app is published (not in testing mode)
- Check browser console for errors

### Frontend can't connect to backend
- Make sure backend is running on port 5000
- Check `REACT_APP_API_URL` in frontend (should be `http://localhost:5000/api`)

## 📋 Quick Checklist

- [ ] PostgreSQL installed
- [ ] Database `tahfidh` created
- [ ] `DB_PASSWORD` set in `backend/.env`
- [ ] `JWT_SECRET` set in `backend/.env`
- [ ] `SESSION_SECRET` set in `backend/.env`
- [ ] Google OAuth credentials in `backend/.env`
- [ ] Dependencies installed (`npm run install:all`)
- [ ] Backend starts successfully
- [ ] Frontend starts successfully
- [ ] Email signup works
- [ ] Google OAuth works
- [ ] Google OAuth app published

## 🎯 After Everything Works Locally

Once everything works locally, you can deploy to production:
- See `DEPLOYMENT_GUIDE.md` for full deployment instructions
- See `PRODUCTION_CHECKLIST.md` for step-by-step checklist

Your app is production-ready! 🚀

