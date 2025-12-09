# View Database Contents in Production

This guide shows you how to view what's in your production database.

## Quick Start

### Using the Script (Recommended)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **View database summary:**
   ```bash
   node view-database.js
   ```

3. **List all users:**
   ```bash
   node view-database.js --users
   ```

4. **View specific user:**
   ```bash
   node view-database.js --user test@example.com
   ```

5. **View progress records:**
   ```bash
   node view-database.js --progress
   ```

6. **View detailed statistics:**
   ```bash
   node view-database.js --stats
   ```

---

## Database Connection

The script uses your `.env` file to connect to the database. Make sure you have:

```env
DB_HOST=dpg-d4rr35c9c44c738e66s0-a.virginia-postgres.render.com
DB_PORT=5432
DB_NAME=tahfidh
DB_USER=tahfidh_user
DB_PASSWORD=ZuGh3NuOIcMb2JI84vRdOyDujFk944cb
DB_SSL=true
```

**Or use the connection string:**
```env
DATABASE_URL=postgresql://tahfidh_user:ZuGh3NuOIcMb2JI84vRdOyDujFk944cb@dpg-d4rr35c9c44c738e66s0-a.virginia-postgres.render.com/tahfidh
```

---

## Using Render CLI

### Connect via Render CLI:

```bash
render psql dpg-d4rr35c9c44c738e66s0-a
```

This will open a PostgreSQL shell connected to your database.

### Useful SQL Queries:

**List all users:**
```sql
SELECT id, email, name, auth_provider, onboarding_complete, created_at 
FROM users 
ORDER BY created_at DESC;
```

**Count users:**
```sql
SELECT COUNT(*) as total_users FROM users;
```

**List users with progress:**
```sql
SELECT DISTINCT u.email, u.name, COUNT(up.id) as progress_count
FROM users u
LEFT JOIN user_progress up ON u.id = up.user_id
GROUP BY u.id, u.email, u.name
HAVING COUNT(up.id) > 0
ORDER BY progress_count DESC;
```

**View all progress:**
```sql
SELECT up.*, u.email, u.name
FROM user_progress up
JOIN users u ON up.user_id = u.id
ORDER BY up.updated_at DESC
LIMIT 20;
```

**View specific user's progress:**
```sql
SELECT up.*
FROM user_progress up
JOIN users u ON up.user_id = u.id
WHERE u.email = 'user@example.com';
```

**Get database statistics:**
```sql
-- User count
SELECT COUNT(*) as total_users FROM users;

-- Progress count
SELECT COUNT(*) as total_progress FROM user_progress;

-- Users with progress
SELECT COUNT(DISTINCT user_id) as users_with_progress FROM user_progress;

-- Onboarding stats
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN onboarding_complete THEN 1 ELSE 0 END) as completed
FROM users;
```

---

## Using External Tools

### Option 1: pgAdmin

1. Download [pgAdmin](https://www.pgadmin.org/)
2. Add new server:
   - **Name:** Render Production
   - **Host:** `dpg-d4rr35c9c44c738e66s0-a.virginia-postgres.render.com`
   - **Port:** `5432`
   - **Database:** `tahfidh`
   - **Username:** `tahfidh_user`
   - **Password:** `ZuGh3NuOIcMb2JI84vRdOyDujFk944cb`
   - **SSL Mode:** Require

### Option 2: DBeaver

1. Download [DBeaver](https://dbeaver.io/)
2. Create new PostgreSQL connection
3. Use the same credentials as above

### Option 3: VS Code Extension

1. Install "PostgreSQL" extension in VS Code
2. Add connection using the credentials above

---

## Direct psql Connection

If you have PostgreSQL client installed:

```bash
psql "postgresql://tahfidh_user:ZuGh3NuOIcMb2JI84vRdOyDujFk944cb@dpg-d4rr35c9c44c738e66s0-a.virginia-postgres.render.com/tahfidh?sslmode=require"
```

Or with separate parameters:

```bash
psql -h dpg-d4rr35c9c44c738e66s0-a.virginia-postgres.render.com \
     -p 5432 \
     -U tahfidh_user \
     -d tahfidh \
     --set=sslmode=require
```

---

## Security Notes

⚠️ **Important:**
- Never commit database credentials to Git
- Use environment variables
- The External Database URL is for connections outside Render
- The Internal Database URL is for Render services only
- Always use SSL in production

---

## Common Tasks

### Find a specific user:
```bash
node view-database.js --user user@example.com
```

### List all users:
```bash
node view-database.js --users
```

### Check database health:
```bash
node view-database.js --stats
```

### View recent activity:
```bash
node view-database.js --progress
```

---

## Troubleshooting

### "Connection refused"
- Check that database is running in Render dashboard
- Verify credentials are correct
- Ensure SSL is enabled

### "Authentication failed"
- Verify username and password
- Check that user has proper permissions

### "Database does not exist"
- Verify database name is `tahfidh`
- Check Render dashboard for correct name

---

## Need Help?

- Check Render database logs
- Verify connection string format
- Test connection with `psql` first
- Check firewall/network settings

