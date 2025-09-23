import { db } from '../database/drizzle.ts';
import { sql } from 'drizzle-orm';

/**
 * Migration script to ensure transaction verification schema exists
 * This script is idempotent and can be run multiple times safely
 */
async function ensureVerificationSchema() {
  try {
    console.log('🚀 Starting transaction verification schema migration...');
    
    // 1. Create verification_status enum if it doesn't exist
    console.log('Creating verification_status enum...');
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE verification_status AS ENUM('pending', 'verified', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN 
          RAISE NOTICE 'verification_status enum already exists, skipping...';
      END $$;
    `);
    console.log('✓ verification_status enum ready');
    
    // 2. Create transaction_verifications table if it doesn't exist
    console.log('Creating transaction_verifications table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transaction_verifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        transaction_id text NOT NULL,
        status verification_status DEFAULT 'pending' NOT NULL,
        verified_by text,
        verified_at timestamp with time zone,
        rejection_reason text,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        CONSTRAINT transaction_verifications_id_unique UNIQUE(id)
      );
    `);
    console.log('✓ transaction_verifications table ready');
    
    // 3. Create indexes for optimal performance
    console.log('Creating performance indexes...');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS transaction_verifications_transaction_id_idx 
      ON transaction_verifications USING btree (transaction_id);
    `);
    console.log('✓ transaction_id index ready');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS transaction_verifications_status_idx 
      ON transaction_verifications USING btree (status);
    `);
    console.log('✓ status index ready');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS transaction_verifications_verified_at_idx 
      ON transaction_verifications USING btree (verified_at);
    `);
    console.log('✓ verified_at index ready');
    
    // 4. Verify the schema is correct
    console.log('Verifying schema...');
    
    const tableExists = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'transaction_verifications'
    `);
    
    if (!tableExists.rows || tableExists.rows.length === 0) {
      throw new Error('transaction_verifications table was not created successfully');
    }
    
    const indexCount = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM pg_indexes 
      WHERE tablename = 'transaction_verifications'
    `);
    
    const expectedIndexes = 4; // Primary key + 3 custom indexes
    const actualIndexes = parseInt(indexCount.rows?.[0]?.count || '0');
    
    if (actualIndexes < expectedIndexes) {
      console.warn(`⚠️  Expected ${expectedIndexes} indexes, found ${actualIndexes}`);
    } else {
      console.log(`✓ All ${actualIndexes} indexes verified`);
    }
    
    // 5. Test basic operations
    console.log('Testing basic operations...');
    
    const testTransactionId = `migration-test-${Date.now()}`;
    
    // Insert test record
    await db.execute(sql`
      INSERT INTO transaction_verifications (transaction_id, status)
      VALUES (${testTransactionId}, 'pending')
    `);
    
    // Query test record
    const testRecord = await db.execute(sql`
      SELECT id, transaction_id, status, created_at
      FROM transaction_verifications 
      WHERE transaction_id = ${testTransactionId}
    `);
    
    if (!testRecord.rows || testRecord.rows.length === 0) {
      throw new Error('Failed to insert/query test record');
    }
    
    // Update test record
    await db.execute(sql`
      UPDATE transaction_verifications 
      SET status = 'verified', verified_by = 'migration-test', verified_at = now()
      WHERE transaction_id = ${testTransactionId}
    `);
    
    // Clean up test record
    await db.execute(sql`
      DELETE FROM transaction_verifications 
      WHERE transaction_id = ${testTransactionId}
    `);
    
    console.log('✓ Basic operations test passed');
    
    console.log('\n🎉 Transaction verification schema migration completed successfully!');
    console.log('\nSchema Summary:');
    console.log('- Table: transaction_verifications');
    console.log('- Columns: id, transaction_id, status, verified_by, verified_at, rejection_reason, created_at, updated_at');
    console.log('- Indexes: transaction_id, status, verified_at');
    console.log('- Status enum: pending, verified, rejected');
    console.log('\nRequirements satisfied:');
    console.log('✓ 4.1 - Verification timestamp and administrator ID storage');
    console.log('✓ 4.2 - Rejection timestamp, administrator ID, and reason storage');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the migration
ensureVerificationSchema();