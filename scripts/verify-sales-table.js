import { db } from '../database/drizzle.ts';
import { sql } from 'drizzle-orm';

async function verifySalesTable() {
  try {
    console.log('Verifying sales table structure...');
    
    // Check if sales table exists
    const tableCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'sales'
    `);
    
    if (tableCheck.rows && tableCheck.rows.length > 0) {
      console.log('✓ sales table exists');
      
      // Check table structure
      const tableStructure = await db.execute(sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'sales'
        ORDER BY ordinal_position
      `);
      
      console.log('✓ Sales table structure:');
      if (tableStructure.rows) {
        tableStructure.rows.forEach(row => {
          console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
        });
      }
      
      // Check if receipt_url column exists
      const receiptUrlCheck = tableStructure.rows?.find(row => row.column_name === 'receipt_url');
      if (receiptUrlCheck) {
        console.log('✓ receipt_url column exists for GCash transaction receipts');
      } else {
        console.log('❌ receipt_url column missing');
      }
      
    } else {
      console.log('❌ sales table does not exist');
    }
    
    console.log('\n🎉 Sales table verification complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifySalesTable();