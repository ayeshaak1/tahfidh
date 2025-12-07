# PostgreSQL Database Check Script

This script checks the health and status of your PostgreSQL database connection.

## Usage

### Option 1: Using npm script (recommended)
```bash
cd backend
npm run check-db
```

### Option 2: Direct execution
```bash
cd backend
node check-db.js
```

## What it checks

The script performs the following checks:

1. **Database Connection** - Tests if the connection to PostgreSQL is working
2. **Database Information** - Shows database name, user, and PostgreSQL version
3. **Table Existence** - Lists all tables in the database
4. **Expected Tables** - Verifies that required tables (`users`, `user_progress`) exist
5. **Table Schemas** - Shows the structure of each table (columns, data types, constraints)
6. **Row Counts** - Displays the number of rows in each table
7. **Sample Data** - Shows sample user and progress data (if any)
8. **Database Indexes** - Lists all indexes for performance reference

## Environment Variables

The script uses the same environment variables as the main application:

- `DB_HOST` - PostgreSQL host (default: `localhost`)
- `DB_PORT` - PostgreSQL port (default: `5432`)
- `DB_NAME` - Database name (default: `tahfidh`)
- `DB_USER` - Database user (default: `postgres`)
- `DB_PASSWORD` - Database password (default: empty)
- `DB_SSL` - Enable SSL connection (default: `false`)

Make sure your `.env` file in the `backend` directory contains these variables.

## Example Output

```
=== PostgreSQL Database Check ===

1. Testing database connection...
   ✓ Connection successful!

2. Database Information:
   Database: tahfidh
   User: postgres
   PostgreSQL Version: PostgreSQL 15.3

3. Checking tables...
   ✓ Found 2 table(s):
     - user_progress
     - users

4. Verifying expected tables...
   ✓ users table exists
   ✓ user_progress table exists

5. Table Schemas:
   users:
     - id: integer NOT NULL DEFAULT nextval('users_id_seq'::regclass)
     - email: character varying(255) NOT NULL
     - name: character varying(255) NOT NULL
     ...

6. Row Counts:
   users: 5 row(s)
   user_progress: 12 row(s)

...
```

## Troubleshooting

### Connection Refused
- Make sure PostgreSQL is running
- Check that `DB_HOST` and `DB_PORT` are correct

### Authentication Failed
- Verify `DB_USER` and `DB_PASSWORD` in your `.env` file

### Database Not Found
- Ensure the database exists
- Check that `DB_NAME` matches your actual database name

### SSL Errors
- If using a local database, set `DB_SSL=false` in `.env`
- For remote databases, you may need to set `DB_SSL=true`

