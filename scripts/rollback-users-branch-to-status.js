/**
 * Rollback script to change users.branch column back to users.status
 * This script will:
 * 1. Recreate the status enum
 * 2. Add the status column back
 * 3. Drop the branch column
 * 4. Set default status values
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { sql } = require('drizzle-orm');

async function rollbackUsersTable() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log('Starting rollback: users.branch -> users.status');

    // Step 1: Check if branch column exists
    const branchColumnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'branch'
    `);

    if (branchColumnExists.length === 0) {
      console.log('Branch column does not exist, rollback may not be needed.');
      return;
    }

    // Step 2: Recreate status enum if it doesn't exist
    try {
      await db.execute(sql`
        CREATE TYPE status AS ENUM ('PENDING', 'APPROVED', 'REJECTED')
      `);
      console.log('Status enum created.');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Status enum already exists.');
      } else {
        throw error;
      }
    }

    // Step 3: Add status column if it doesn't exist
    const statusColumnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'status'
    `);

    if (statusColumnExists.length === 0) {
      console.log('Adding status column...');
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN status status DEFAULT 'PENDING'
      `);
      console.log('Status column added.');
    } else {
      console.log('Status column already exists.');
    }

    // Step 4: Set default status for existing users
    console.log('Setting default status for existing users...');
    await db.execute(sql`
      UPDATE users SET status = 'PENDING' WHERE status IS NULL
    `);
    console.log('Default status values set.');

    // Step 5: Drop the branch column
    console.log('Dropping branch column...');
    await db.execute(sql`ALTER TABLE users DROP COLUMN branch`);
    console.log('Branch column dropped.');

    console.log('Rollback completed successfully!');

  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run rollback if this script is executed directly
if (require.main === module) {
  console.log('⚠️  WARNING: This will rollback the users table migration!');
  console.log('📋 Rollback: Change users.branch column back to users.status');
  console.log('');
  
  rollbackUsersTable()
    .then(() => {
      console.log('Rollback script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Rollback script failed:', error);
      process.exit(1);
    });
}

module.exports = { rollbackUsersTable };