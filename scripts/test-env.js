#!/usr/bin/env node

/**
 * Test script to verify environment variables are loading correctly
 */

console.log('🔍 Testing environment variable loading...\n');

// Try different ways of loading env vars
console.log('1. Loading .env.local first:');
require('dotenv').config({ path: '.env.local' });
console.log('   DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('   DATABASE_URL preview:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'undefined');

console.log('\n2. Loading .env as fallback:');
require('dotenv').config();
console.log('   DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('   DATABASE_URL preview:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'undefined');

console.log('\n3. Current working directory:', process.cwd());

console.log('\n4. Checking for .env files:');
const fs = require('fs');
const path = require('path');

const envFiles = ['.env.local', '.env', '.env.development', '.env.production'];
envFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`   ${file}: ${exists ? '✅ exists' : '❌ not found'}`);
});

console.log('\n5. All environment variables starting with DATABASE:');
Object.keys(process.env)
  .filter(key => key.includes('DATABASE'))
  .forEach(key => {
    console.log(`   ${key}: ${process.env[key] ? 'set' : 'undefined'}`);
  });

if (process.env.DATABASE_URL) {
  console.log('\n✅ DATABASE_URL is properly loaded!');
  console.log('You can now run the migration with: npm run migrate:users');
} else {
  console.log('\n❌ DATABASE_URL is not loaded.');
  console.log('Please check your .env.local file and ensure DATABASE_URL is set.');
}