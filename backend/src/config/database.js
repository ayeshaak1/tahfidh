const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tahfidh',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Test the connection
pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Connected to PostgreSQL database');
  }
});

pool.on('error', (err) => {
  // Always log errors, even in production
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        auth_provider VARCHAR(50) DEFAULT 'email',
        onboarding_complete BOOLEAN DEFAULT FALSE,
        progress JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns if they don't exist (for existing databases)
    await pool.query(`
      DO $$ 
      BEGIN
        -- Add google_id column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='users' AND column_name='google_id'
        ) THEN
          ALTER TABLE users ADD COLUMN google_id VARCHAR(255);
          CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id_unique ON users(google_id) WHERE google_id IS NOT NULL;
        END IF;
        
        -- Add auth_provider column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='users' AND column_name='auth_provider'
        ) THEN
          ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'email';
        END IF;
        
        -- Make password nullable if it's not already
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='users' AND column_name='password' AND is_nullable='NO'
        ) THEN
          ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
        END IF;
      END $$;
    `);

    // Create indexes for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);
    
    // Create index on google_id if it doesn't exist (only if column exists)
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='users' AND column_name='google_id'
        ) AND NOT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE tablename = 'users' AND indexname = 'idx_users_google_id'
        ) THEN
          CREATE INDEX idx_users_google_id ON users(google_id);
        END IF;
      END $$;
    `);

    // Create progress table for storing user progress (alternative to JSONB in users table)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        surah_id VARCHAR(10) NOT NULL,
        surah_name VARCHAR(255) NOT NULL,
        verses JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, surah_id)
      )
    `);

    // Create index on user_id and surah_id
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id)
    `);

    if (process.env.NODE_ENV !== 'production') {
      console.log('Database tables initialized successfully');
    }
  } catch (error) {
    // Always log errors, even in production
    console.error('Error initializing database:', error);
    throw error;
  }
}

module.exports = {
  pool,
  initializeDatabase,
};

