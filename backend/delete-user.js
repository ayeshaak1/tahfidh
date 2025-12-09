#!/usr/bin/env node

/**
 * Delete User Script
 * 
 * This script allows you to delete users from your database.
 * 
 * Usage:
 *   node delete-user.js user@example.com
 *   node delete-user.js --id 123
 *   node delete-user.js --list
 *   node delete-user.js --list --email test@
 */

const { pool } = require('./src/config/database');
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function listUsers(emailFilter = null) {
  try {
    let query = 'SELECT id, email, name, auth_provider, onboarding_complete, created_at FROM users';
    let params = [];
    
    if (emailFilter) {
      query += ' WHERE email LIKE $1';
      params.push(`%${emailFilter}%`);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    
    log('\n📋 Users in Database:', 'cyan');
    log('='.repeat(80), 'bright');
    
    if (result.rows.length === 0) {
      log('No users found.', 'yellow');
    } else {
      log(`\nTotal users: ${result.rows.length}\n`, 'bright');
      result.rows.forEach((user, index) => {
        log(`${index + 1}. Email: ${user.email}`, 'bright');
        log(`   Name: ${user.name}`);
        log(`   ID: ${user.id}`);
        log(`   Auth Provider: ${user.auth_provider || 'email'}`);
        log(`   Onboarding Complete: ${user.onboarding_complete ? 'Yes' : 'No'}`);
        log(`   Created: ${user.created_at}`);
        log('');
      });
    }
    
    log('='.repeat(80), 'bright');
  } catch (error) {
    log(`\n❌ Error listing users: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

async function getUserInfo(emailOrId, byId = false) {
  try {
    let query, params;
    
    if (byId) {
      query = 'SELECT id, email, name, auth_provider, onboarding_complete, created_at FROM users WHERE id = $1';
      params = [parseInt(emailOrId)];
    } else {
      query = 'SELECT id, email, name, auth_provider, onboarding_complete, created_at FROM users WHERE email = $1';
      params = [emailOrId];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    log(`\n❌ Error finding user: ${error.message}`, 'red');
    console.error(error);
    return null;
  }
}

async function getProgressCount(userId) {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM user_progress WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count);
  } catch (error) {
    return 0;
  }
}

async function deleteUser(emailOrId, byId = false) {
  const client = await pool.connect();
  
  try {
    // First, find the user
    const user = await getUserInfo(emailOrId, byId);
    
    if (!user) {
      log(`\n❌ User not found: ${emailOrId}`, 'red');
      process.exit(1);
    }
    
    const userId = user.id;
    const userEmail = user.email;
    const userName = user.name;
    
    // Get progress count
    const progressCount = await getProgressCount(userId);
    
    // Show user info
    log('\n🗑️  Deleting User Account', 'yellow');
    log('='.repeat(80), 'bright');
    log(`Email: ${userEmail}`);
    log(`Name: ${userName}`);
    log(`ID: ${userId}`);
    log(`Auth Provider: ${user.auth_provider || 'email'}`);
    log(`Progress Records: ${progressCount}`);
    log(`Created: ${user.created_at}`);
    log('='.repeat(80), 'bright');
    
    // Confirm deletion
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('\n⚠️  Are you sure you want to delete this user? (yes/no): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      log('\n❌ Deletion cancelled.', 'yellow');
      return;
    }
    
    // Start transaction
    await client.query('BEGIN');
    
    // Delete user progress
    const progressResult = await client.query(
      'DELETE FROM user_progress WHERE user_id = $1',
      [userId]
    );
    log(`\n✓ Deleted ${progressResult.rowCount} progress record(s)`, 'green');
    
    // Delete user
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    log(`✓ Deleted user account`, 'green');
    
    // Commit transaction
    await client.query('COMMIT');
    
    log(`\n✅ Successfully deleted user: ${userEmail}`, 'green');
    log('='.repeat(80), 'bright');
    
  } catch (error) {
    await client.query('ROLLBACK');
    log(`\n❌ Error deleting user: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Usage:
  node delete-user.js <email>              Delete user by email
  node delete-user.js --id <user_id>       Delete user by ID
  node delete-user.js --list               List all users
  node delete-user.js --list --email <filter>  List users matching email filter

Examples:
  node delete-user.js user@example.com
  node delete-user.js --id 123
  node delete-user.js --list
  node delete-user.js --list --email test@
    `);
    process.exit(0);
  }
  
  if (args[0] === '--list') {
    const emailFilter = args.includes('--email') && args[args.indexOf('--email') + 1]
      ? args[args.indexOf('--email') + 1]
      : null;
    await listUsers(emailFilter);
    await pool.end();
    process.exit(0);
  }
  
  if (args[0] === '--id') {
    if (!args[1]) {
      log('❌ Error: User ID required after --id', 'red');
      process.exit(1);
    }
    await deleteUser(args[1], true);
  } else {
    await deleteUser(args[0], false);
  }
  
  await pool.end();
  process.exit(0);
}

// Run the script
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

