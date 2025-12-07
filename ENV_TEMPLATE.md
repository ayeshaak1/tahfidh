# Environment Variables Template

Copy these to your `backend/.env` file and fill in the values.

## Your Google OAuth Credentials (Already Created)

✅ **Client ID:** `419219087780-n6badp54fuit0c32c657nej2pnu7gd0f.apps.googleusercontent.com`
✅ **Client Secret:** `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`

## Complete .env Template

```env
# ============================================================================
# Quran.com API Credentials
# ============================================================================
QURAN_CLIENT_ID=99b3cedc-45f3-4e02-abae-14bb9f492983
QURAN_CLIENT_SECRET=MWai4iG9XJHKxnLN0bksbZy5ok

# ============================================================================
# Server Configuration
# ============================================================================
PORT=5000
NODE_ENV=development

# ============================================================================
# Database Configuration (PostgreSQL)
# ============================================================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tahfidh
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here
DB_SSL=false

# ============================================================================
# JWT Secret Key
# ============================================================================
# Generate by running: node backend/generate-jwt-secret.js
JWT_SECRET=paste-generated-secret-here

# ============================================================================
# Google OAuth Credentials
# ============================================================================
GOOGLE_CLIENT_ID=419219087780-n6badp54fuit0c32c657nej2pnu7gd0f.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# ============================================================================
# OAuth URLs
# ============================================================================
# Development
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000

# Production (update after deployment)
# GOOGLE_CALLBACK_URL=https://your-backend-url.com/api/auth/google/callback
# FRONTEND_URL=https://your-domain.com

# ============================================================================
# Session Secret
# ============================================================================
# Can use same value as JWT_SECRET
SESSION_SECRET=same-as-jwt-secret-or-different
```

## Quick Setup Steps

1. **Generate JWT Secret:**
   ```bash
   cd backend
   node generate-jwt-secret.js
   ```
   Copy the output and paste for `JWT_SECRET` and `SESSION_SECRET`.

2. **Set PostgreSQL Password:**
   - Use the password you set when installing PostgreSQL
   - Or create a new user: `CREATE USER tahfidh_user WITH PASSWORD 'your_password';`

3. **For Production:**
   - Update `GOOGLE_CALLBACK_URL` to your backend URL
   - Update `FRONTEND_URL` to your frontend domain
   - Update database credentials to your hosted PostgreSQL
   - Set `NODE_ENV=production`
   - Set `DB_SSL=true` for hosted databases

## Security Reminders

⚠️ **NEVER commit `.env` files to Git**
⚠️ **NEVER share your credentials publicly**
⚠️ **Use different secrets for production**

