import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { sql } from "drizzle-orm";
import { checkAdminPermission } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    // Check admin permission
    const authResult = await checkAdminPermission(req);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(req.url);
    const itemIds = searchParams.get('itemIds')?.split(',') || [];
    const excludeBranch = searchParams.get('excludeBranch');

    if (itemIds.length === 0) {
      return NextResponse.json(
        { error: "Item IDs are required" },
        { status: 400 }
      );
    }

    // First, get the names and details for the requested item IDs
    const requestedItemsQuery = sql`
      SELECT id, sku, name, category
      FROM inventory_items 
      WHERE id IN (${sql.join(itemIds.map(id => sql`${id}`), sql`, `)})
    `;

    const requestedItemsResult = await db.execute(requestedItemsQuery);
    const requestedItems = (requestedItemsResult as any).rows;

    console.log('Requested items from database:', requestedItems);

    if (requestedItems.length === 0) {
      return NextResponse.json([]);
    }

    const itemNames = requestedItems.map((item: any) => item.name);
    console.log('Item names to search for:', itemNames);

    // Debug: Let's see all hair clippers in the database
    const debugQuery = sql`
      SELECT branch, id, name, sku, quantity, status
      FROM inventory_items 
      WHERE LOWER(name) LIKE LOWER('%hair clipper%')
      ORDER BY branch, name
    `;
    const debugResult = await db.execute(debugQuery);
    console.log('All hair clippers in database:', (debugResult as any).rows);

    // Build the query to get available stock from other branches using item names
    let query = sql`
      SELECT 
        branch,
        id as "itemId",
        name as "itemName",
        sku,
        quantity as "availableQuantity",
        unit_price as "unitPrice"
      FROM inventory_items
      WHERE quantity > 0
        AND status = 'in-stock'
    `;

    // Add name filter to find same products in other branches
    if (itemNames.length > 0) {
      const nameConditions = itemNames.map((name: string) => sql`name = ${name}`);
      query = sql`${query} AND (${sql.join(nameConditions, sql` OR `)})`;
    }

    // Exclude the requesting branch
    if (excludeBranch) {
      query = sql`${query} AND branch != ${excludeBranch}`;
    }

    // Order by branch and available quantity (highest first)
    query = sql`${query} ORDER BY branch, quantity DESC`;

    const result = await db.execute(query);
    const branchStocks = (result as any).rows;

    console.log('Found branch stocks:', branchStocks);
    console.log('Exclude branch:', excludeBranch);
    console.log('Final query executed for branch stocks');

    // Map the branch stocks back to the original requested item IDs
    const mappedStocks = branchStocks.map((stock: any) => {
      const originalItem = requestedItems.find((item: any) => item.name === stock.itemName);
      return {
        ...stock,
        originalItemId: originalItem?.id || stock.itemId, // Map back to the requested item ID
      };
    });

    return NextResponse.json(mappedStocks);
  } catch (error) {
    console.error("Error fetching branch stocks:", error);
    return NextResponse.json(
      { error: "Failed to fetch branch stocks" },
      { status: 500 }
    );
  }
}