const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { sql } = require('drizzle-orm');

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function addStockTransfersTables() {
  try {
    console.log('Adding stock transfers tables...');

    // Add fulfillment_plan column to item_requests table
    await db.execute(sql`
      ALTER TABLE item_requests 
      ADD COLUMN IF NOT EXISTS fulfillment_plan TEXT;
    `);
    console.log('✓ Added fulfillment_plan column to item_requests table');

    // Create stock_transfers table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS stock_transfers (
        id TEXT PRIMARY KEY,
        transfer_number TEXT UNIQUE NOT NULL,
        from_branch TEXT NOT NULL,
        to_branch TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        request_id TEXT,
        initiated_by TEXT NOT NULL,
        initiated_date TIMESTAMPTZ DEFAULT NOW(),
        completed_by TEXT,
        completed_date TIMESTAMPTZ,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✓ Created stock_transfers table');

    // Create stock_transfer_items table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS stock_transfer_items (
        id TEXT PRIMARY KEY,
        transfer_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        item_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price NUMERIC(10,2) NOT NULL,
        total_price NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✓ Created stock_transfer_items table');

    // Add indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_stock_transfers_from_branch ON stock_transfers(from_branch);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_stock_transfers_to_branch ON stock_transfers(to_branch);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON stock_transfers(status);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_stock_transfers_request_id ON stock_transfers(request_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_transfer_id ON stock_transfer_items(transfer_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_item_id ON stock_transfer_items(item_id);
    `);
    console.log('✓ Created indexes for stock transfers tables');

    console.log('✅ Stock transfers tables migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the migration
if (require.main === module) {
  addStockTransfersTables()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addStockTransfersTables };