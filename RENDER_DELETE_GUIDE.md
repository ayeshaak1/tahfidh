# How to Delete Resources from Render

This guide shows you how to delete various resources from your Render account.

## Table of Contents

1. [Delete a Web Service (Backend)](#delete-a-web-service-backend)
2. [Delete a Database](#delete-a-database)
3. [Delete Environment Variables](#delete-environment-variables)
4. [Delete a Static Site](#delete-a-static-site)
5. [Delete Your Entire Account](#delete-your-entire-account)

---

## Delete a Web Service (Backend)

### Steps:

1. **Go to Render Dashboard**
   - Visit [https://dashboard.render.com](https://dashboard.render.com)
   - Sign in to your account

2. **Navigate to Your Service**
   - Click on the service you want to delete (e.g., `tahfidh-backend`)

3. **Open Settings**
   - Click on the **"Settings"** tab in the left sidebar

4. **Delete the Service**
   - Scroll down to the bottom of the Settings page
   - Click the **"Delete Service"** button (usually in red)
   - You'll be asked to confirm:
     - Type the service name to confirm
     - Click **"Delete"** or **"Confirm Delete"**

5. **Wait for Deletion**
   - The service will be deleted immediately
   - All associated data (except database) will be removed

**⚠️ Warning:** This will delete your backend service. Make sure you have backups if needed!

---

## Delete a Database

### Steps:

1. **Go to Render Dashboard**
   - Visit [https://dashboard.render.com](https://dashboard.render.com)

2. **Navigate to Your Database**
   - Click on the database you want to delete (e.g., `tahfidh-db`)

3. **Open Settings**
   - Click on the **"Settings"** tab in the left sidebar

4. **Delete the Database**
   - Scroll down to find the **"Delete Database"** section
   - Click the **"Delete Database"** button (usually in red)
   - **⚠️ IMPORTANT:** You'll see a warning that this action is **IRREVERSIBLE**
   - Type the database name to confirm
   - Click **"Delete Database"** or **"Confirm Delete"**

5. **Wait for Deletion**
   - Database deletion may take a few minutes
   - All data will be permanently deleted

**⚠️ CRITICAL WARNING:** 
- **This action cannot be undone!**
- **All data in the database will be permanently lost!**
- **Make sure you have exported/backed up your data before deleting!**

### Export Data Before Deleting:

If you need to save your data first:

1. **Using psql (PostgreSQL client):**
   ```bash
   pg_dump -h <database-host> -U <username> -d <database-name> > backup.sql
   ```

2. **Using Render's Internal Connection:**
   - Go to your database in Render
   - Copy the "Internal Database URL"
   - Use it with pg_dump or a database client

3. **Using your backend API:**
   - If you have an export endpoint, use it to download user data

---

## Delete Environment Variables

### Delete Individual Variables:

1. **Go to Your Service**
   - Navigate to the service (backend, frontend, etc.)

2. **Open Environment Tab**
   - Click on the **"Environment"** tab

3. **Delete Variable**
   - Find the variable you want to delete
   - Click the **trash icon** or **"Delete"** button next to it
   - Confirm the deletion

### Delete All Variables:

- You'll need to delete them one by one (no bulk delete option)

---

## Delete a Static Site

If you deployed a static site to Render (unlikely for this project, but just in case):

1. **Go to Render Dashboard**
2. **Click on the static site**
3. **Go to Settings**
4. **Click "Delete Static Site"**
5. **Confirm deletion**

---

## Delete Your Entire Account

### Steps:

1. **Go to Account Settings**
   - Click on your profile/avatar in the top right
   - Select **"Account Settings"** or **"Settings"**

2. **Delete Account**
   - Scroll down to find **"Delete Account"** or **"Account Deletion"**
   - Click the delete button
   - You'll be asked to confirm:
     - This will delete ALL services, databases, and data
     - Type your account email or password to confirm
     - Click **"Delete Account"**

**⚠️ WARNING:** This will delete:
- All web services
- All databases
- All static sites
- All environment variables
- All logs and metrics
- **This cannot be undone!**

---

## Common Scenarios

### Scenario 1: Start Fresh (Delete Everything)

If you want to delete everything and start over:

1. **Delete Backend Service**
   - Follow steps in "Delete a Web Service" above

2. **Delete Database**
   - Follow steps in "Delete a Database" above
   - **Export data first if needed!**

3. **Delete Environment Variables** (optional)
   - They'll be deleted automatically when you delete the service

4. **Recreate Resources**
   - Follow `PRODUCTION_DEPLOYMENT.md` to set up again

### Scenario 2: Delete Only Backend, Keep Database

If you want to keep your database but delete the backend:

1. **Delete Backend Service** (follow steps above)
2. **Database remains** - you can reconnect to it later
3. **Recreate Backend** - use the same database connection string

### Scenario 3: Delete Test/Development Resources

If you have multiple environments:

1. **Identify test resources** (check names, URLs)
2. **Delete test backend** (if separate)
3. **Delete test database** (if separate)
4. **Keep production resources**

---

## What Happens When You Delete?

### Web Service:
- ✅ Service stops immediately
- ✅ URL becomes unavailable
- ✅ Environment variables are deleted
- ✅ Logs are deleted (after retention period)
- ✅ Metrics are deleted
- ❌ Database is NOT deleted (if separate)

### Database:
- ✅ Database stops immediately
- ✅ All data is permanently deleted
- ✅ Connection strings become invalid
- ✅ Backups are deleted
- ❌ **This cannot be undone!**

---

## Recovery Options

### If You Accidentally Deleted Something:

1. **Check if it's in "Deleted" section** (if Render has one)
   - Some services allow recovery within 24-48 hours
   - Check your Render dashboard

2. **Contact Render Support**
   - Go to [Render Support](https://render.com/support)
   - Explain what was deleted
   - They may be able to help (no guarantees)

3. **Restore from Backup**
   - If you have database backups, restore them
   - If you have code backups, redeploy

### Prevention:

- ✅ **Always backup databases before deletion**
- ✅ **Use version control (Git) for code**
- ✅ **Export important data regularly**
- ✅ **Double-check before clicking delete**
- ✅ **Use staging/test environments for testing**

---

## Alternative: Suspend Instead of Delete

If you're not sure about deleting, you can:

1. **Suspend the Service**
   - Go to Settings → Suspend Service
   - Service stops but isn't deleted
   - You can resume later
   - **Note:** Free tier services auto-suspend after inactivity

2. **Scale Down to Zero**
   - Set instance count to 0
   - Service stops but configuration remains
   - You can scale back up later

---

## Quick Reference

| Resource | Delete Location | Reversible? | Data Loss? |
|----------|----------------|------------|------------|
| Web Service | Settings → Delete Service | ❌ No | ⚠️ Service data only |
| Database | Settings → Delete Database | ❌ No | ⚠️ **ALL DATA** |
| Environment Variable | Environment → Delete | ❌ No | ❌ No (just config) |
| Static Site | Settings → Delete | ❌ No | ⚠️ Site data only |
| Account | Account Settings → Delete | ❌ No | ⚠️ **EVERYTHING** |

---

## Need Help?

- **Render Documentation:** [https://render.com/docs](https://render.com/docs)
- **Render Support:** [https://render.com/support](https://render.com/support)
- **Render Community:** [https://community.render.com](https://community.render.com)

---

**Remember:** Always backup important data before deleting anything!

