// Migration script to add receipt_url column to sales table
const { db } = require('../database/drizzle');
const { sql } = require('drizzle-orm');

async function addReceiptUrlColumn() {
  try {
    console.log('Checking if receipt_url column exists...');
    
    // Check if column exists
    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sales' AND column_name = 'receipt_url';
    `);
    
    if (columnCheck.rows?.length === 0) {
      console.log('Adding receipt_url column...');
      await db.execute(sql`
        ALTER TABLE sales ADD COLUMN receipt_url text;
      `);
      console.log('✅ Successfully added receipt_url column to sales table');
    } else {
      console.log('✅ receipt_url column already exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding receipt_url column:', error);
    process.exit(1);
  }
}

addReceiptUrlColumn();