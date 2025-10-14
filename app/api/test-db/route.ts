import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    console.log("Testing database connection...");
    
    // Test basic database connection
    const testQuery = sql`SELECT 1 as test`;
    const testResult = await db.execute(testQuery);
    console.log("Basic DB test:", testResult);
    
    // Check if item_requests table exists
    const tableCheck = sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'item_requests'
    `;
    const tableResult = await db.execute(tableCheck);
    console.log("Table check result:", tableResult);
    
    // Get table structure if it exists
    if ((tableResult as any).rows?.length > 0) {
      const columnsQuery = sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'item_requests'
        ORDER BY ordinal_position
      `;
      const columnsResult = await db.execute(columnsQuery);
      console.log("Table columns:", columnsResult);
      
      // Try to count rows
      const countQuery = sql`SELECT COUNT(*) as count FROM item_requests`;
      const countResult = await db.execute(countQuery);
      console.log("Row count:", countResult);
      
      return NextResponse.json({
        success: true,
        tableExists: true,
        columns: (columnsResult as any).rows,
        rowCount: (countResult as any).rows[0]?.count || 0
      });
    } else {
      return NextResponse.json({
        success: true,
        tableExists: false,
        message: "item_requests table does not exist"
      });
    }
    
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}