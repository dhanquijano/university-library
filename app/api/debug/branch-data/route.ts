import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    console.log("Getting branch data...");
    
    // Get all branches from inventory_branches table
    const branchesQuery = sql`
      SELECT id, name, address, phone, manager_id as "managerId"
      FROM inventory_branches
      ORDER BY name
    `;
    const branchesResult = await db.execute(branchesQuery);
    const branches = (branchesResult as any).rows || [];
    
    // Get unique branch names from inventory_items
    const itemBranchesQuery = sql`
      SELECT DISTINCT branch, COUNT(*) as item_count
      FROM inventory_items
      GROUP BY branch
      ORDER BY branch
    `;
    const itemBranchesResult = await db.execute(itemBranchesQuery);
    const itemBranches = (itemBranchesResult as any).rows || [];
    
    // Get unique branch names from users table
    const userBranchesQuery = sql`
      SELECT DISTINCT branch, COUNT(*) as user_count, 
             STRING_AGG(full_name || ' (' || role || ')', ', ') as users
      FROM users
      WHERE branch IS NOT NULL
      GROUP BY branch
      ORDER BY branch
    `;
    const userBranchesResult = await db.execute(userBranchesQuery);
    const userBranches = (userBranchesResult as any).rows || [];
    
    // Get unique branch names from item_requests
    const requestBranchesQuery = sql`
      SELECT DISTINCT branch, COUNT(*) as request_count
      FROM item_requests
      GROUP BY branch
      ORDER BY branch
    `;
    const requestBranchesResult = await db.execute(requestBranchesQuery);
    const requestBranches = (requestBranchesResult as any).rows || [];
    
    return NextResponse.json({
      inventoryBranches: branches,
      inventoryItemBranches: itemBranches,
      userBranches: userBranches,
      requestBranches: requestBranches,
      summary: {
        totalBranchesInLookup: branches.length,
        totalBranchesInItems: itemBranches.length,
        totalBranchesInUsers: userBranches.length,
        totalBranchesInRequests: requestBranches.length
      }
    });
  } catch (error) {
    console.error("Error getting branch data:", error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}