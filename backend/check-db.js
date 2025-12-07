const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool with the same config as the main app
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tahfidh',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkDatabase() {
  let client;
  
  try {
    log('\n=== PostgreSQL Database Check ===\n', 'cyan');
    
    // Test connection
    log('1. Testing database connection...', 'blue');
    client = await pool.connect();
    log('   ✓ Connection successful!', 'green');
    
    // Get database info
    log('\n2. Database Information:', 'blue');
    const dbInfo = await client.query('SELECT version(), current_database(), current_user');
    log(`   Database: ${dbInfo.rows[0].current_database}`, 'green');
    log(`   User: ${dbInfo.rows[0].current_user}`, 'green');
    log(`   PostgreSQL Version: ${dbInfo.rows[0].version.split(',')[0]}`, 'green');
    
    // Check if tables exist
    log('\n3. Checking tables...', 'blue');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const expectedTables = ['users', 'user_progress'];
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    if (existingTables.length === 0) {
      log('   ⚠ No tables found in database', 'yellow');
    } else {
      log(`   ✓ Found ${existingTables.length} table(s):`, 'green');
      existingTables.forEach(table => {
        log(`     - ${table}`, 'green');
      });
      
      // Check for expected tables
      log('\n4. Verifying expected tables...', 'blue');
      expectedTables.forEach(table => {
        if (existingTables.includes(table)) {
          log(`   ✓ ${table} table exists`, 'green');
        } else {
          log(`   ✗ ${table} table is missing`, 'red');
        }
      });
    }
    
    // Get table schemas
    if (existingTables.length > 0) {
      log('\n5. Table Schemas:', 'blue');
      for (const table of existingTables) {
        const columnsResult = await client.query(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table]);
        
        log(`\n   ${table}:`, 'cyan');
        columnsResult.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          log(`     - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`, 'green');
        });
      }
    }
    
    // Get row counts
    if (existingTables.length > 0) {
      log('\n6. Row Counts:', 'blue');
      for (const table of existingTables) {
        try {
          const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
          const count = parseInt(countResult.rows[0].count);
          log(`   ${table}: ${count} row(s)`, count > 0 ? 'green' : 'yellow');
        } catch (err) {
          log(`   ${table}: Error counting rows - ${err.message}`, 'red');
        }
      }
    }
    
    // Check users table data (if exists)
    if (existingTables.includes('users')) {
      log('\n7. Sample Users Data:', 'blue');
      try {
        const usersResult = await client.query(`
          SELECT id, email, name, auth_provider, onboarding_complete, created_at
          FROM users
          ORDER BY created_at DESC
          LIMIT 5
        `);
        
        if (usersResult.rows.length === 0) {
          log('   No users found', 'yellow');
        } else {
          usersResult.rows.forEach((user, index) => {
            log(`   User ${index + 1}:`, 'cyan');
            log(`     ID: ${user.id}`, 'green');
            log(`     Email: ${user.email}`, 'green');
            log(`     Name: ${user.name}`, 'green');
            log(`     Auth Provider: ${user.auth_provider || 'N/A'}`, 'green');
            log(`     Onboarding: ${user.onboarding_complete ? 'Complete' : 'Incomplete'}`, 'green');
            log(`     Created: ${user.created_at}`, 'green');
          });
        }
      } catch (err) {
        log(`   Error fetching users: ${err.message}`, 'red');
      }
    }
    
    // Check user_progress table data (if exists)
    if (existingTables.includes('user_progress')) {
      log('\n8. Sample User Progress Data:', 'blue');
      try {
        const progressResult = await client.query(`
          SELECT 
            user_id, 
            surah_id, 
            surah_name, 
            jsonb_object_keys(verses)::text as verse_key,
            updated_at
          FROM user_progress
          CROSS JOIN LATERAL jsonb_object_keys(verses) AS verse_key
          ORDER BY updated_at DESC
          LIMIT 10
        `);
        
        if (progressResult.rows.length === 0) {
          // Try a simpler query to see if there are any records at all
          const simpleResult = await client.query(`
            SELECT user_id, surah_id, surah_name, 
                   jsonb_typeof(verses) as verses_type,
                   jsonb_array_length(jsonb_object_keys(verses)) as verse_count,
                   updated_at
            FROM user_progress
            ORDER BY updated_at DESC
            LIMIT 5
          `);
          
          if (simpleResult.rows.length === 0) {
            log('   No progress records found', 'yellow');
          } else {
            // Show records even if verses are empty
            simpleResult.rows.forEach((record, index) => {
              const verseCount = record.verses ? Object.keys(JSON.parse(JSON.stringify(record.verses || {}))).length : 0;
              log(`   Progress ${index + 1}:`, 'cyan');
              log(`     User ID: ${record.user_id}`, 'green');
              log(`     Surah: ${record.surah_name} (ID: ${record.surah_id})`, 'green');
              log(`     Verses: ${verseCount}`, 'green');
              log(`     Updated: ${record.updated_at}`, 'green');
            });
          }
        } else {
          // Group by user_id and surah_id to show unique records
          const uniqueRecords = new Map();
          progressResult.rows.forEach(row => {
            const key = `${row.user_id}-${row.surah_id}`;
            if (!uniqueRecords.has(key)) {
              uniqueRecords.set(key, {
                user_id: row.user_id,
                surah_id: row.surah_id,
                surah_name: row.surah_name,
                verse_count: 0,
                updated_at: row.updated_at
              });
            }
            uniqueRecords.get(key).verse_count++;
          });
          
          Array.from(uniqueRecords.values()).slice(0, 5).forEach((record, index) => {
            log(`   Progress ${index + 1}:`, 'cyan');
            log(`     User ID: ${record.user_id}`, 'green');
            log(`     Surah: ${record.surah_name} (ID: ${record.surah_id})`, 'green');
            log(`     Verses: ${record.verse_count}`, 'green');
            log(`     Updated: ${record.updated_at}`, 'green');
          });
        }
      } catch (err) {
        // Fallback to simpler query if the complex one fails
        try {
          const simpleResult = await client.query(`
            SELECT user_id, surah_id, surah_name, verses, updated_at
            FROM user_progress
            ORDER BY updated_at DESC
            LIMIT 5
          `);
          
          if (simpleResult.rows.length === 0) {
            log('   No progress records found', 'yellow');
          } else {
            simpleResult.rows.forEach((record, index) => {
              const verses = record.verses || {};
              const verseCount = typeof verses === 'object' ? Object.keys(verses).length : 0;
              log(`   Progress ${index + 1}:`, 'cyan');
              log(`     User ID: ${record.user_id}`, 'green');
              log(`     Surah: ${record.surah_name} (ID: ${record.surah_id})`, 'green');
              log(`     Verses: ${verseCount}`, 'green');
              log(`     Updated: ${record.updated_at}`, 'green');
            });
          }
        } catch (fallbackErr) {
          log(`   Error fetching progress: ${fallbackErr.message}`, 'red');
        }
      }
    }
    
    // Check indexes
    log('\n9. Database Indexes:', 'blue');
    try {
      const indexesResult = await client.query(`
        SELECT 
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `);
      
      if (indexesResult.rows.length === 0) {
        log('   No indexes found', 'yellow');
      } else {
        indexesResult.rows.forEach(idx => {
          log(`   ${idx.tablename}.${idx.indexname}`, 'green');
        });
      }
    } catch (err) {
      log(`   Error fetching indexes: ${err.message}`, 'red');
    }
    
    log('\n=== Database Check Complete ===\n', 'cyan');
    
  } catch (error) {
    log('\n✗ Database check failed!', 'red');
    log(`\nError: ${error.message}`, 'red');
    
    if (error.code === 'ECONNREFUSED') {
      log('\nPossible issues:', 'yellow');
      log('  - PostgreSQL server is not running', 'yellow');
      log('  - Wrong host or port in .env file', 'yellow');
    } else if (error.code === '28P01') {
      log('\nPossible issues:', 'yellow');
      log('  - Wrong username or password in .env file', 'yellow');
    } else if (error.code === '3D000') {
      log('\nPossible issues:', 'yellow');
      log('  - Database does not exist', 'yellow');
      log('  - Wrong database name in .env file', 'yellow');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the check
checkDatabase().catch(err => {
  log(`\nFatal error: ${err.message}`, 'red');
  process.exit(1);
});

