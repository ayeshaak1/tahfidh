/**
 * Generate a secure JWT secret key
 * Run this with: node generate-jwt-secret.js
 */

const crypto = require('crypto');

// Generate a random 64-byte (512-bit) secret key
const secret = crypto.randomBytes(64).toString('hex');

console.log('='.repeat(60));
console.log('JWT Secret Key Generated');
console.log('='.repeat(60));
console.log('');
console.log('Add this to your backend/.env file:');
console.log('');
console.log(`JWT_SECRET=${secret}`);
console.log('');
console.log('='.repeat(60));
console.log('');
console.log('⚠️  IMPORTANT: Keep this secret secure and never commit it to version control!');
console.log('');

