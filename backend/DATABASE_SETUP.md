# PostgreSQL Database Setup Guide

This guide will help you set up PostgreSQL for the Tahfidh application.

## Prerequisites

1. **Install PostgreSQL**
   - Download from: https://www.postgresql.org/download/
   - Or use a package manager:
     - Windows: `choco install postgresql` (Chocolatey)
     - Mac: `brew install postgresql`
     - Linux: `sudo apt-get install postgresql` (Ubuntu/Debian)

2. **Start PostgreSQL Service**
   - Windows: PostgreSQL service should start automatically
   - Mac/Linux: `sudo service postgresql start` or `brew services start postgresql`

## Database Setup

### 1. Create Database

Open PostgreSQL command line (psql) or use a GUI tool like pgAdmin:

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database
CREATE DATABASE tahfidh;

-- Create a user (optional, you can use postgres user)
CREATE USER tahfidh_user WITH PASSWORD 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE tahfidh TO tahfidh_user;
```

### 2. Configure Environment Variables

Edit `backend/.env` and set your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tahfidh
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_SSL=false
```

**For production/cloud databases (like Heroku, AWS RDS, etc.):**
```env
DB_HOST=your-database-host.amazonaws.com
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_SSL=true
```

### 3. Generate JWT Secret Key

**Option 1: Using the provided script (Recommended)**
```bash
cd backend
node generate-jwt-secret.js
```

This will output a secure random JWT secret. Copy it and add to `backend/.env`:
```env
JWT_SECRET=your-generated-secret-key-here
```

**Option 2: Using Node.js directly**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Option 3: Using OpenSSL (Linux/Mac)**
```bash
openssl rand -hex 64
```

### 4. Initialize Database Tables

The database tables will be automatically created when you start the server. The application will:

1. Connect to PostgreSQL
2. Create `users` table if it doesn't exist
3. Create `user_progress` table if it doesn't exist
4. Create necessary indexes

### 5. Start the Server

```bash
cd backend
npm run dev
```

You should see:
```
Connected to PostgreSQL database
Database tables initialized successfully
Quran API proxy server running on port 5000
```

## Database Schema

### Users Table
- `id` (SERIAL PRIMARY KEY) - Auto-incrementing user ID
- `email` (VARCHAR UNIQUE) - User email address
- `name` (VARCHAR) - User's name
- `password` (VARCHAR) - Hashed password (bcrypt)
- `onboarding_complete` (BOOLEAN) - Whether user completed onboarding
- `progress` (JSONB) - User's memorization progress
- `created_at` (TIMESTAMP) - Account creation time
- `updated_at` (TIMESTAMP) - Last update time

### User Progress Table
- `id` (SERIAL PRIMARY KEY) - Auto-incrementing ID
- `user_id` (INTEGER) - Foreign key to users table
- `surah_id` (VARCHAR) - Surah number
- `surah_name` (VARCHAR) - Surah name
- `verses` (JSONB) - Verse memorization data
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Last update time

## Troubleshooting

### Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** Make sure PostgreSQL is running:
- Windows: Check Services (services.msc) for "postgresql-x64-XX"
- Mac: `brew services list` or `pg_ctl status`
- Linux: `sudo service postgresql status`

### Authentication Failed
```
Error: password authentication failed for user "postgres"
```
**Solution:** 
1. Check your password in `backend/.env`
2. Reset PostgreSQL password if needed:
   ```sql
   ALTER USER postgres WITH PASSWORD 'new_password';
   ```

### Database Does Not Exist
```
Error: database "tahfidh" does not exist
```
**Solution:** Create the database:
```sql
CREATE DATABASE tahfidh;
```

### Permission Denied
```
Error: permission denied for database
```
**Solution:** Grant privileges:
```sql
GRANT ALL PRIVILEGES ON DATABASE tahfidh TO your_user;
```

## Production Considerations

1. **Use Connection Pooling**: Already configured with max 20 connections
2. **Enable SSL**: Set `DB_SSL=true` for production databases
3. **Backup Regularly**: Set up automated backups
4. **Monitor Performance**: Use PostgreSQL's built-in monitoring tools
5. **Secure Credentials**: Never commit `.env` file to version control

## Cloud Database Options

### Heroku Postgres
```env
DB_HOST=your-heroku-host.com
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_user
DB_PASSWORD=your_password
DB_SSL=true
```

### AWS RDS
```env
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_user
DB_PASSWORD=your_password
DB_SSL=true
```

### Supabase / Neon / Railway
These services provide connection strings. Parse them and set individual variables, or modify `database.js` to accept a connection string.

