import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { inventoryItems } from '@/database/schema';
import { checkSessionAdminPermission } from '@/lib/session-auth';
import { getBranchFilterForRole, getBranchNameFromId } from '@/lib/admin-utils';
import { eq } from 'drizzle-orm';

// GET: List all inventory items
export async function GET(req: NextRequest) {
  try {
    console.log("Inventory items API called");
    
    // Check admin permission and get user info
    const authResult = await checkSessionAdminPermission(req);
    console.log("Auth result:", authResult);
    
    if (!authResult.authorized) {
      console.log("Auth failed:", authResult.error);
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    console.log("User info:", {
      role: authResult.user.role,
      branch: authResult.user.branch,
      name: authResult.user.name
    });

    // Apply branch filtering for managers
    const branchFilter = getBranchFilterForRole(authResult.user.role, authResult.user.branch);
    console.log("Branch filter result:", branchFilter);
    
    let items;
    if (branchFilter.shouldFilter && branchFilter.branchId) {
      // For managers, we need to convert branch ID to branch name
      const branchName = await getBranchNameFromId(branchFilter.branchId);
      console.log(`Branch ID ${branchFilter.branchId} maps to branch name: ${branchName}`);
      
      if (branchName) {
        console.log("Filtering items by branch name:", branchName);
        // Managers can only see items from their branch (using branch name)
        items = await db.select().from(inventoryItems).where(eq(inventoryItems.branch, branchName));
        console.log(`Found ${items.length} items for branch: ${branchName}`);
      } else {
        console.log("Branch name not found for ID:", branchFilter.branchId);
        items = []; // No items if branch name not found
      }
    } else {
      console.log("No branch filtering - showing all items (Admin access)");
      // Admins can see all items
      items = await db.select().from(inventoryItems);
      console.log(`Found ${items.length} total items`);
    }
    
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch items', 
      details: error.message 
    }, { status: 500 });
  }
}

// POST: Add a new inventory item
export async function POST(req: NextRequest) {
  try {
    console.log("POST inventory items API called");
    
    // Check admin permission and get user info
    const authResult = await checkSessionAdminPermission(req);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const data = await req.json();
    console.log('Received data:', data);
    
    // Validate required fields
    if (!data.name || !data.sku || !data.category || !data.supplier || !data.branch) {
      console.log('Missing required fields:', { name: !!data.name, sku: !!data.sku, category: !!data.category, supplier: !!data.supplier, branch: !!data.branch });
      return NextResponse.json({ 
        error: 'Missing required fields: name, sku, category, supplier, branch' 
      }, { status: 400 });
    }

    // Apply branch filtering for managers - they can only create items for their branch
    const branchFilter = getBranchFilterForRole(authResult.user.role, authResult.user.branch);
    if (branchFilter.shouldFilter && branchFilter.branchId) {
      const branchName = await getBranchNameFromId(branchFilter.branchId);
      if (branchName && data.branch !== branchName) {
        return NextResponse.json(
          { error: `You can only create inventory items for your assigned branch: ${branchName}` },
          { status: 403 }
        );
      }
    }
    
    // Create item data with proper defaults
    const itemData = {
      name: data.name,
      sku: data.sku,
      category: data.category,
      quantity: parseInt(data.quantity) || 0,
      reorderThreshold: parseInt(data.reorderThreshold) || 10,
      unitPrice: (parseFloat(data.unitPrice) || 0).toString(), // Convert to string for decimal type
      supplier: data.supplier,
      expirationDate: data.expirationDate || null,
      status: data.status || 'in-stock',
      branch: data.branch,
    };
    
    console.log('Attempting to insert item data:', itemData);
    
    const [item] = await db.insert(inventoryItems).values(itemData).returning();
    console.log('Successfully created item:', item);
    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error creating item:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({ 
      error: 'Failed to create item',
      details: error.message,
      name: error.name
    }, { status: 500 });
  }
}