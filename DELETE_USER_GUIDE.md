# How to Delete a User from Your Database

This guide shows you how to delete users from your application's database (hosted on Render).

## Table of Contents

1. [Method 1: Via API (User Self-Deletion)](#method-1-via-api-user-self-deletion)
2. [Method 2: Via SQL (Direct Database Access)](#method-2-via-sql-direct-database-access)
3. [Method 3: Via Script (Recommended)](#method-3-via-script-recommended)
4. [Method 4: Via Render Database Dashboard](#method-4-via-render-database-dashboard)

---

## Method 1: Via API (User Self-Deletion)

If the user wants to delete their own account, they can use the API endpoint:

### Using curl:

```bash
curl -X DELETE https://your-backend.onrender.com/api/auth/account \
  -H "Authorization: Bearer USER_TOKEN_HERE"
```

### Using the Frontend:

Users can delete their account from the Profile page (if you've implemented this feature).

**Note:** This only works if you have the user's authentication token.

---

## Method 2: Via SQL (Direct Database Access)

### Step 1: Get Database Connection String

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your database (e.g., `tahfidh-db`)
3. Go to **"Info"** tab
4. Copy the **"Internal Database URL"** or connection details

### Step 2: Connect to Database

**Option A: Using psql (PostgreSQL client)**

```bash
psql "postgresql://username:password@host:port/database"
```

**Option B: Using Render's Shell**

1. In Render dashboard, go to your database
2. Click **"Connect"** or **"Shell"** (if available)
3. You'll get a terminal connection

### Step 3: Delete User

**Find the user first:**

```sql
-- List all users
SELECT id, email, name, created_at FROM users;

-- Find specific user by email
SELECT id, email, name FROM users WHERE email = 'user@example.com';
```

**Delete the user:**

```sql
-- Start a transaction
BEGIN;

-- Delete user progress first
DELETE FROM user_progress WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com');

-- Delete the user
DELETE FROM users WHERE email = 'user@example.com';

-- Commit the transaction
COMMIT;
```

**Or delete by user ID:**

```sql
BEGIN;

-- Replace 123 with the actual user ID
DELETE FROM user_progress WHERE user_id = 123;
DELETE FROM users WHERE id = 123;

COMMIT;
```

---

## Method 3: Via Script (Recommended)

I'll create a script you can run locally to delete users easily.

### Using the Script:

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Run the delete script:**
   ```bash
   node delete-user.js user@example.com
   ```

   Or delete by user ID:
   ```bash
   node delete-user.js --id 123
   ```

3. **List all users first:**
   ```bash
   node delete-user.js --list
   ```

**The script will:**
- ✅ Connect to your database
- ✅ Find the user
- ✅ Delete their progress
- ✅ Delete the user account
- ✅ Show confirmation

---

## Method 4: Via Render Database Dashboard

Render doesn't have a built-in SQL editor in the dashboard, but you can:

1. **Use Render's Shell** (if available):
   - Go to your database in Render
   - Click "Connect" or "Shell"
   - Run SQL commands directly

2. **Use External Tools:**
   - Connect using pgAdmin, DBeaver, or any PostgreSQL client
   - Use the connection string from Render
   - Run SQL commands

---

## Quick Reference

### Delete Single User by Email:

```sql
BEGIN;
DELETE FROM user_progress WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com');
DELETE FROM users WHERE email = 'user@example.com';
COMMIT;
```

### Delete Multiple Users:

```sql
BEGIN;
DELETE FROM user_progress WHERE user_id IN (SELECT id FROM users WHERE email IN ('user1@example.com', 'user2@example.com'));
DELETE FROM users WHERE email IN ('user1@example.com', 'user2@example.com');
COMMIT;
```

### Delete All Test Users:

```sql
BEGIN;
DELETE FROM user_progress WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test%@example.com');
DELETE FROM users WHERE email LIKE 'test%@example.com';
COMMIT;
```

### Delete All Users (⚠️ DANGEROUS):

```sql
BEGIN;
DELETE FROM user_progress;
DELETE FROM users;
COMMIT;
```

---

## Safety Tips

1. **Always backup before deleting:**
   ```sql
   -- Export user data first
   COPY (SELECT * FROM users WHERE email = 'user@example.com') TO '/tmp/user_backup.csv';
   ```

2. **Use transactions:**
   - Always wrap deletions in `BEGIN` and `COMMIT`
   - If something goes wrong, use `ROLLBACK`

3. **Verify before deleting:**
   ```sql
   -- Check what will be deleted
   SELECT * FROM users WHERE email = 'user@example.com';
   SELECT * FROM user_progress WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com');
   ```

4. **Test on a development database first**

---

## Troubleshooting

### "User not found"
- Check the email spelling
- Verify the user exists: `SELECT * FROM users WHERE email = 'user@example.com';`

### "Foreign key constraint violation"
- Make sure you delete `user_progress` before deleting `users`
- Or use CASCADE (if configured): `DELETE FROM users WHERE id = 123 CASCADE;`

### "Permission denied"
- Make sure you're using the correct database credentials
- Check that your database user has DELETE permissions

---

## Need Help?

- Check Render database logs
- Verify connection string is correct
- Test with a non-critical user first

