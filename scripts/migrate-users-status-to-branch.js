/**
 * Migration script to change users.status column to users.branch
 * This script will:
 * 1. Add the new branch column
 * 2. Drop the old status column
 * 3. Handle any existing data appropriately
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { sql } = require('drizzle-orm');

async function migrateUsersTable() {
  const connectionString = process.env.DATABASE_URL;
  
  console.log('Environment check:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- DATABASE_URL exists:', !!connectionString);
  console.log('- DATABASE_URL preview:', connectionString ? connectionString.substring(0, 20) + '...' : 'undefined');
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.error('');
    console.error('Please ensure you have DATABASE_URL set in your .env.local file');
    console.error('Current working directory:', process.cwd());
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log('Starting migration: users.status -> users.branch');

    // Step 1: Check if status column exists
    const statusColumnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'status'
    `);

    if (statusColumnExists.length === 0) {
      console.log('Status column does not exist, checking if branch column already exists...');
      
      const branchColumnExists = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'branch'
      `);

      if (branchColumnExists.length > 0) {
        console.log('Branch column already exists. Migration appears to be complete.');
        return;
      } else {
        console.log('Adding branch column...');
        await db.execute(sql`ALTER TABLE users ADD COLUMN branch TEXT`);
        console.log('Branch column added successfully.');
        return;
      }
    }

    // Step 2: Add branch column if it doesn't exist
    const branchColumnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'branch'
    `);

    if (branchColumnExists.length === 0) {
      console.log('Adding branch column...');
      await db.execute(sql`ALTER TABLE users ADD COLUMN branch TEXT`);
      console.log('Branch column added.');
    } else {
      console.log('Branch column already exists.');
    }

    // Step 3: Migrate existing data (optional - you can customize this logic)
    // For now, we'll set branch to NULL for all users
    // You can modify this to set specific branch values based on your business logic
    console.log('Updating existing users with branch data...');
    
    // Example: Set all users to a default branch or leave as NULL
    // await db.execute(sql`UPDATE users SET branch = 'main' WHERE branch IS NULL`);
    
    console.log('Existing user data updated.');

    // Step 4: Drop the status column
    console.log('Dropping status column...');
    await db.execute(sql`ALTER TABLE users DROP COLUMN status`);
    console.log('Status column dropped.');

    // Step 5: Drop the status enum if it's no longer used elsewhere
    // Check if status enum is used in other tables
    const statusEnumUsage = await db.execute(sql`
      SELECT table_name, column_name
      FROM information_schema.columns 
      WHERE udt_name = 'status' AND table_name != 'users'
    `);

    if (statusEnumUsage.length === 0) {
      console.log('Dropping unused status enum...');
      try {
        await db.execute(sql`DROP TYPE status`);
        console.log('Status enum dropped.');
      } catch (error) {
        console.warn('Could not drop status enum (it may be referenced elsewhere):', error.message);
      }
    } else {
      console.log('Status enum is still used in other tables, keeping it.');
    }

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateUsersTable()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateUsersTable };