# Quick Start Guide - PostgreSQL & JWT Setup

## 1. Install PostgreSQL

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Or use Chocolatey: `choco install postgresql`

**Mac:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

## 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE tahfidh;

# Exit psql
\q
```

## 3. Generate JWT Secret

```bash
cd backend
node generate-jwt-secret.js
```

Copy the generated `JWT_SECRET` value.

## 4. Configure Environment Variables

Edit `backend/.env` and add:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tahfidh
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_SSL=false

# JWT Secret (paste the generated secret here)
JWT_SECRET=your-generated-secret-key-here
```

## 5. Install Dependencies & Start

```bash
cd backend
npm install
npm run dev
```

The server will automatically:
- Connect to PostgreSQL
- Create database tables
- Start the API server

## Troubleshooting

**PostgreSQL not running?**
- Windows: Check Services → PostgreSQL
- Mac: `brew services start postgresql`
- Linux: `sudo service postgresql start`

**Can't connect to database?**
- Check `DB_PASSWORD` in `.env` matches your PostgreSQL password
- Default PostgreSQL user is `postgres`

**JWT_SECRET not set?**
- The server will exit with an error if `JWT_SECRET` is missing
- Run `node generate-jwt-secret.js` to generate one

For detailed setup instructions, see `DATABASE_SETUP.md`.

