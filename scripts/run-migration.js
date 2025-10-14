#!/usr/bin/env node

/**
 * Simple script to run the users table migration
 * Usage: node scripts/run-migration.js
 */

// Load environment variables from .env.local file
require('dotenv').config({ path: '.env.local' });

// Also try loading from .env as fallback
require('dotenv').config();

const { migrateUsersTable } = require('./migrate-users-status-to-branch');

console.log('🚀 Starting database migration...');
console.log('📋 Migration: Change users.status column to users.branch');
console.log('');

migrateUsersTable()
  .then(() => {
    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('📝 Summary:');
    console.log('   - Removed users.status column');
    console.log('   - Added users.branch column');
    console.log('   - Updated database schema');
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.log('');
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('Full error:', error);
    console.log('');
    process.exit(1);
  });