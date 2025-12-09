#!/usr/bin/env node

/**
 * Database Viewer Script
 * 
 * This script allows you to view database contents in production.
 * 
 * Usage:
 *   node view-database.js                    # Show summary
 *   node view-database.js --users            # List all users
 *   node view-database.js --progress         # List all progress
 *   node view-database.js --user <email>     # Show specific user details
 *   node view-database.js --stats            # Show statistics
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
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString();
}

async function showSummary() {
  try {
    // Get user count
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(userCount.rows[0].count);
    
    // Get progress count
    const progressCount = await pool.query('SELECT COUNT(*) as count FROM user_progress');
    const totalProgress = parseInt(progressCount.rows[0].count);
    
    // Get users with progress
    const usersWithProgress = await pool.query(
      'SELECT COUNT(DISTINCT user_id) as count FROM user_progress'
    );
    const usersWithProgressCount = parseInt(usersWithProgress.rows[0].count);
    
    // Get onboarding stats
    const onboardingStats = await pool.query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN onboarding_complete THEN 1 ELSE 0 END) as complete FROM users'
    );
    const onboardingComplete = parseInt(onboardingStats.rows[0].complete);
    const onboardingTotal = parseInt(onboardingStats.rows[0].total);
    
    log('\n📊 Database Summary', 'cyan');
    log('='.repeat(80), 'bright');
    log(`\n👥 Users: ${totalUsers}`, 'bright');
    log(`   - Completed onboarding: ${onboardingComplete}`, onboardingComplete > 0 ? 'green' : 'yellow');
    log(`   - Pending onboarding: ${onboardingTotal - onboardingComplete}`, 'yellow');
    log(`\n📈 Progress Records: ${totalProgress}`, 'bright');
    log(`   - Users with progress: ${usersWithProgressCount}`, 'green');
    log(`   - Average records per user: ${usersWithProgressCount > 0 ? (totalProgress / usersWithProgressCount).toFixed(1) : 0}`, 'cyan');
    log('\n' + '='.repeat(80), 'bright');
  } catch (error) {
    log(`\n❌ Error getting summary: ${error.message}`, 'red');
    console.error(error);
  }
}

async function listUsers() {
  try {
    const result = await pool.query(
      `SELECT id, email, name, auth_provider, onboarding_complete, 
              created_at, updated_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    
    log('\n👥 All Users', 'cyan');
    log('='.repeat(80), 'bright');
    
    if (result.rows.length === 0) {
      log('No users found.', 'yellow');
    } else {
      log(`\nTotal: ${result.rows.length} users\n`, 'bright');
      
      result.rows.forEach((user, index) => {
        log(`${index + 1}. ${user.email}`, 'bright');
        log(`   Name: ${user.name}`);
        log(`   ID: ${user.id}`);
        log(`   Auth: ${user.auth_provider || 'email'}`);
        log(`   Onboarding: ${user.onboarding_complete ? '✓ Complete' : '✗ Pending'}`, 
            user.onboarding_complete ? 'green' : 'yellow');
        log(`   Created: ${formatDate(user.created_at)}`);
        log(`   Updated: ${formatDate(user.updated_at)}`);
        log('');
      });
    }
    
    log('='.repeat(80), 'bright');
  } catch (error) {
    log(`\n❌ Error listing users: ${error.message}`, 'red');
    console.error(error);
  }
}

async function showUserDetails(email) {
  try {
    // Get user info
    const userResult = await pool.query(
      `SELECT id, email, name, auth_provider, onboarding_complete, 
              google_id, created_at, updated_at, progress
       FROM users 
       WHERE email = $1`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      log(`\n❌ User not found: ${email}`, 'red');
      return;
    }
    
    const user = userResult.rows[0];
    const userId = user.id;
    
    // Get progress
    const progressResult = await pool.query(
      `SELECT surah_id, surah_name, verses, created_at, updated_at
       FROM user_progress 
       WHERE user_id = $1
       ORDER BY surah_id`,
      [userId]
    );
    
    log('\n👤 User Details', 'cyan');
    log('='.repeat(80), 'bright');
    log(`\nEmail: ${user.email}`, 'bright');
    log(`Name: ${user.name}`);
    log(`ID: ${user.id}`);
    log(`Auth Provider: ${user.auth_provider || 'email'}`);
    if (user.google_id) {
      log(`Google ID: ${user.google_id}`);
    }
    log(`Onboarding: ${user.onboarding_complete ? '✓ Complete' : '✗ Pending'}`, 
        user.onboarding_complete ? 'green' : 'yellow');
    log(`Created: ${formatDate(user.created_at)}`);
    log(`Updated: ${formatDate(user.updated_at)}`);
    
    // Show progress
    log(`\n📈 Progress Records: ${progressResult.rows.length}`, 'bright');
    
    if (progressResult.rows.length === 0) {
      log('No progress records found.', 'yellow');
    } else {
      progressResult.rows.forEach((progress) => {
        const verses = typeof progress.verses === 'string' 
          ? JSON.parse(progress.verses) 
          : progress.verses;
        const memorizedCount = Object.values(verses).filter(v => v === true).length;
        const totalVerses = Object.keys(verses).length;
        
        log(`\n  Surah ${progress.surah_id}: ${progress.surah_name}`, 'cyan');
        log(`    Memorized: ${memorizedCount}/${totalVerses} verses`);
        log(`    Updated: ${formatDate(progress.updated_at)}`);
      });
    }
    
    log('\n' + '='.repeat(80), 'bright');
  } catch (error) {
    log(`\n❌ Error getting user details: ${error.message}`, 'red');
    console.error(error);
  }
}

async function listProgress() {
  try {
    const result = await pool.query(
      `SELECT up.id, up.user_id, u.email, u.name, up.surah_id, up.surah_name, 
              up.verses, up.created_at, up.updated_at
       FROM user_progress up
       JOIN users u ON up.user_id = u.id
       ORDER BY up.updated_at DESC
       LIMIT 50`
    );
    
    log('\n📈 Recent Progress Records (Last 50)', 'cyan');
    log('='.repeat(80), 'bright');
    
    if (result.rows.length === 0) {
      log('No progress records found.', 'yellow');
    } else {
      log(`\nShowing ${result.rows.length} records\n`, 'bright');
      
      result.rows.forEach((record, index) => {
        const verses = typeof record.verses === 'string' 
          ? JSON.parse(record.verses) 
          : record.verses;
        const memorizedCount = Object.values(verses).filter(v => v === true).length;
        const totalVerses = Object.keys(verses).length;
        
        log(`${index + 1}. ${record.email}`, 'bright');
        log(`   Surah ${record.surah_id}: ${record.surah_name}`);
        log(`   Progress: ${memorizedCount}/${totalVerses} verses memorized`, 'green');
        log(`   Updated: ${formatDate(record.updated_at)}`);
        log('');
      });
    }
    
    log('='.repeat(80), 'bright');
  } catch (error) {
    log(`\n❌ Error listing progress: ${error.message}`, 'red');
    console.error(error);
  }
}

async function showStats() {
  try {
    log('\n📊 Database Statistics', 'cyan');
    log('='.repeat(80), 'bright');
    
    // User stats
    const userStats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN auth_provider = 'google' THEN 1 END) as google_users,
        COUNT(CASE WHEN auth_provider = 'email' OR auth_provider IS NULL THEN 1 END) as email_users,
        COUNT(CASE WHEN onboarding_complete = true THEN 1 END) as completed_onboarding,
        COUNT(CASE WHEN onboarding_complete = false THEN 1 END) as pending_onboarding
      FROM users
    `);
    
    const stats = userStats.rows[0];
    
    log('\n👥 User Statistics:', 'bright');
    log(`   Total Users: ${stats.total}`);
    log(`   - Email/Password: ${stats.email_users}`, 'cyan');
    log(`   - Google OAuth: ${stats.google_users}`, 'cyan');
    log(`   - Completed Onboarding: ${stats.completed_onboarding}`, 'green');
    log(`   - Pending Onboarding: ${stats.pending_onboarding}`, 'yellow');
    
    // Progress stats
    const progressStats = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT user_id) as users_with_progress,
        COUNT(DISTINCT surah_id) as unique_surahs
      FROM user_progress
    `);
    
    const pStats = progressStats.rows[0];
    
    log('\n📈 Progress Statistics:', 'bright');
    log(`   Total Progress Records: ${pStats.total_records}`);
    log(`   Users with Progress: ${pStats.users_with_progress}`, 'green');
    log(`   Unique Surahs Tracked: ${pStats.unique_surahs}`, 'cyan');
    
    // Recent activity
    const recentUsers = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);
    
    const recentProgress = await pool.query(`
      SELECT COUNT(*) as count 
      FROM user_progress 
      WHERE updated_at > NOW() - INTERVAL '7 days'
    `);
    
    log('\n📅 Recent Activity (Last 7 Days):', 'bright');
    log(`   New Users: ${recentUsers.rows[0].count}`, 'green');
    log(`   Progress Updates: ${recentProgress.rows[0].count}`, 'green');
    
    // Top users by progress
    const topUsers = await pool.query(`
      SELECT 
        u.email,
        u.name,
        COUNT(up.id) as surah_count
      FROM users u
      LEFT JOIN user_progress up ON u.id = up.user_id
      GROUP BY u.id, u.email, u.name
      ORDER BY surah_count DESC
      LIMIT 5
    `);
    
    if (topUsers.rows.length > 0) {
      log('\n🏆 Top Users by Progress:', 'bright');
      topUsers.rows.forEach((user, index) => {
        log(`   ${index + 1}. ${user.email} - ${user.surah_count} surahs tracked`, 'cyan');
      });
    }
    
    log('\n' + '='.repeat(80), 'bright');
  } catch (error) {
    log(`\n❌ Error getting statistics: ${error.message}`, 'red');
    console.error(error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Usage:
  node view-database.js                    Show database summary
  node view-database.js --users            List all users
  node view-database.js --progress         List recent progress records
  node view-database.js --user <email>     Show specific user details
  node view-database.js --stats            Show detailed statistics

Examples:
  node view-database.js
  node view-database.js --users
  node view-database.js --user test@example.com
  node view-database.js --stats
    `);
    await pool.end();
    process.exit(0);
  }
  
  if (args[0] === '--users' || args[0] === '-u') {
    await listUsers();
  } else if (args[0] === '--progress' || args[0] === '-p') {
    await listProgress();
  } else if (args[0] === '--user') {
    if (!args[1]) {
      log('❌ Error: Email required after --user', 'red');
      await pool.end();
      process.exit(1);
    }
    await showUserDetails(args[1]);
  } else if (args[0] === '--stats' || args[0] === '-s') {
    await showStats();
  } else {
    await showSummary();
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

