// Script to delete a Google OAuth account from the database
// Usage: node delete-google-account.js <email>
// Or: node delete-google-account.js --list (to list all Google accounts)

const { pool } = require('./src/config/database');
require('dotenv').config();

async function listGoogleAccounts() {
  try {
    const result = await pool.query(
      'SELECT id, email, name, google_id, auth_provider, onboarding_complete, created_at FROM users WHERE auth_provider = $1 OR google_id IS NOT NULL',
      ['google']
    );
    
    console.log('\n📋 Google OAuth Accounts:');
    console.log('='.repeat(80));
    if (result.rows.length === 0) {
      console.log('No Google accounts found.');
    } else {
      result.rows.forEach((user, index) => {
        console.log(`\n${index + 1}. Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Google ID: ${user.google_id || 'N/A'}`);
        console.log(`   Auth Provider: ${user.auth_provider || 'N/A'}`);
        console.log(`   Onboarding Complete: ${user.onboarding_complete}`);
        console.log(`   Created: ${user.created_at}`);
        console.log(`   User ID: ${user.id}`);
      });
    }
    console.log('\n' + '='.repeat(80));
  } catch (error) {
    console.error('Error listing Google accounts:', error);
    process.exit(1);
  }
}

async function deleteGoogleAccount(email) {
  const client = await pool.connect();
  try {
    // First, find the user
    const userResult = await client.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.error(`❌ No user found with email: ${email}`);
      process.exit(1);
    }

    const user = userResult.rows[0];
    const userId = user.id;

    console.log(`\n🗑️  Deleting account for: ${user.email} (${user.name})`);
    console.log(`   User ID: ${userId}`);

    await client.query('BEGIN');

    // Delete user progress (CASCADE will handle this, but being explicit)
    const progressResult = await client.query('DELETE FROM user_progress WHERE user_id = $1', [userId]);
    console.log(`   Deleted ${progressResult.rowCount} progress records`);

    // Delete user
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    console.log(`   Deleted user account`);

    await client.query('COMMIT');

    console.log(`\n✅ Successfully deleted account for: ${email}\n`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error deleting account:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log('\n📖 Usage:');
  console.log('  node delete-google-account.js <email>     - Delete account by email');
  console.log('  node delete-google-account.js --list      - List all Google accounts');
  console.log('  node delete-google-account.js --help      - Show this help\n');
  process.exit(0);
}

if (args[0] === '--list' || args[0] === '-l') {
  listGoogleAccounts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
} else {
  const email = args[0];
  deleteGoogleAccount(email)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

