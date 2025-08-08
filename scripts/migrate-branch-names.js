// Migration script to update old branch names to new ones
// Run this once to fix any existing data with old branch names

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { inventoryItems } = require('../database/schema');
const { eq } = require('drizzle-orm');

// Database connection
const connectionString = process.env.DATABASE_URL || 'your-database-url';
const sql = postgres(connectionString);
const db = drizzle(sql);

// Branch name mapping
const branchMapping = {
  'Main Branch': 'Sanbry Main Branch',
  'Downtown Branch': 'Sanbry Makati',
  'Mall Branch': 'Sanbry BGC'
};

async function migrateBranchNames() {
  try {
    console.log('Starting branch name migration...');
    
    // Get all items with old branch names
    const itemsToUpdate = await db.select().from(inventoryItems);
    
    let updatedCount = 0;
    
    for (const item of itemsToUpdate) {
      if (branchMapping[item.branch]) {
        const newBranchName = branchMapping[item.branch];
        console.log(`Updating item ${item.name}: "${item.branch}" → "${newBranchName}"`);
        
        await db.update(inventoryItems)
          .set({ branch: newBranchName })
          .where(eq(inventoryItems.id, item.id));
        
        updatedCount++;
      }
    }
    
    console.log(`Migration completed! Updated ${updatedCount} items.`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
  }
}

// Run migration
migrateBranchNames();