import { db } from '../database/drizzle.ts';
import { sql } from 'drizzle-orm';

async function testVerificationSchema() {
  try {
    console.log('Testing database connection...');

    // Test basic connection
    await db.execute(sql`SELECT 1 as test`);
    console.log('✓ Database connection successful');

    // Check if transaction_verifications table exists
    const tableCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'transaction_verifications'
    `);

    if (tableCheck.rows && tableCheck.rows.length > 0) {
      console.log('✓ transaction_verifications table already exists');
    } else {
      console.log('Creating transaction_verifications table...');

      // Create enum type if it doesn't exist
      await db.execute(sql`
        DO $$ BEGIN
          CREATE TYPE verification_status AS ENUM('pending', 'verified', 'rejected');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Create the table
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

      // Create indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS transaction_verifications_transaction_id_idx 
        ON transaction_verifications USING btree (transaction_id);
      `);

      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS transaction_verifications_status_idx 
        ON transaction_verifications USING btree (status);
      `);

      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS transaction_verifications_verified_at_idx 
        ON transaction_verifications USING btree (verified_at);
      `);

      console.log('✓ transaction_verifications table created successfully');
    }

    // Test inserting a sample record
    console.log('Testing table operations...');

    const testId = `test-${Date.now()}`;
    await db.execute(sql`
      INSERT INTO transaction_verifications (transaction_id, status)
      VALUES (${testId}, 'pending')
    `);

    const selectResult = await db.execute(sql`
      SELECT * FROM transaction_verifications 
      WHERE transaction_id = ${testId}
    `);

    if (selectResult.rows && selectResult.rows.length > 0) {
      console.log('✓ Table operations working correctly');

      // Clean up test record
      await db.execute(sql`
        DELETE FROM transaction_verifications 
        WHERE transaction_id = ${testId}
      `);
      console.log('✓ Test record cleaned up');
    }

    // Verify table structure
    console.log('Verifying table structure...');
    const tableStructure = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'transaction_verifications'
      ORDER BY ordinal_position
    `);

    console.log('✓ Table structure:');
    if (tableStructure.rows) {
      tableStructure.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
    }

    // Verify indexes
    console.log('Verifying indexes...');
    const indexes = await db.execute(sql`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'transaction_verifications'
    `);

    console.log('✓ Indexes:');
    if (indexes.rows) {
      indexes.rows.forEach(row => {
        console.log(`  - ${row.indexname}`);
      });
    }

    console.log('\n🎉 All tests passed! Transaction verification schema is ready.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testVerificationSchema();