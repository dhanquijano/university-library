import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { sql } from "drizzle-orm";
import { itemRequests } from "@/database/schema";
import { checkSessionAdminPermission } from "@/lib/session-auth";
import { getBranchFilterForRole, getBranchNameFromId } from "@/lib/admin-utils";

export async function GET(req: NextRequest) {
  try {
    console.log("Item requests API called");
    
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const branch = searchParams.get('branch');

    // Build WHERE conditions dynamically
    let whereConditions = [];
    
    if (status) {
      whereConditions.push(`status = '${status}'`);
    }

    if (branch) {
      whereConditions.push(`branch = '${branch}'`);
    }

    // Apply branch filtering for managers
    const branchFilter = getBranchFilterForRole(authResult.user.role, authResult.user.branch);
    console.log("Branch filter result:", branchFilter);
    
    if (branchFilter.shouldFilter && branchFilter.branchId) {
      // For managers, we need to convert branch ID to branch name
      const branchName = await getBranchNameFromId(branchFilter.branchId);
      console.log(`Branch ID ${branchFilter.branchId} maps to branch name: ${branchName}`);
      
      if (branchName) {
        whereConditions.push(`branch = '${branchName}'`);
        console.log("Applied branch filter for manager:", branchName);
      } else {
        console.log("Branch name not found for ID:", branchFilter.branchId);
        // If branch name not found, return empty results
        return NextResponse.json([]);
      }
    } else {
      console.log("No branch filtering - showing all requests (Admin access)");
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const queryString = `
      SELECT 
        id,
        request_number as "requestNumber",
        status,
        items,
        total_amount as "totalAmount",
        requested_by as "requestedBy",
        requested_date as "requestedDate",
        reviewed_by as "reviewedBy",
        reviewed_date as "reviewedDate",
        notes,
        rejection_reason as "rejectionReason",
        branch,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM item_requests
      ${whereClause}
      ORDER BY requested_date DESC
    `;

    console.log("Executing query:", queryString);
    const result = await db.execute(sql.raw(queryString));
    const requests = (result as any).rows || [];
    console.log("Query result:", requests.length, "requests found");

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching item requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch item requests", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("POST item requests API called");
    
    // Check admin permission and get user info
    const authResult = await checkSessionAdminPermission(req);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await req.json();
    console.log('Received request body:', body);
    const { items, totalAmount, notes, branch, requestedBy } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items array is required and cannot be empty" },
        { status: 400 }
      );
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: "Total amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (!branch) {
      return NextResponse.json(
        { error: "Branch is required" },
        { status: 400 }
      );
    }

    // Apply branch filtering for managers - they can only create requests for their branch
    const branchFilter = getBranchFilterForRole(authResult.user.role, authResult.user.branch);
    if (branchFilter.shouldFilter && branchFilter.branchId) {
      const branchName = await getBranchNameFromId(branchFilter.branchId);
      if (branchName && branch !== branchName) {
        return NextResponse.json(
          { error: `You can only create item requests for your assigned branch: ${branchName}` },
          { status: 403 }
        );
      }
    }

    // Generate unique request number
    const requestNumber = `REQ-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Insert the request using Drizzle schema
    const [newRequest] = await db.insert(itemRequests).values({
      requestNumber,
      status: 'pending',
      items: JSON.stringify(items),
      totalAmount: totalAmount.toString(),
      requestedBy: requestedBy || authResult.user.name || 'Manager',
      notes: notes || null,
      branch,
    }).returning({
      id: itemRequests.id,
      requestNumber: itemRequests.requestNumber,
      status: itemRequests.status,
      items: itemRequests.items,
      totalAmount: itemRequests.totalAmount,
      requestedBy: itemRequests.requestedBy,
      requestedDate: itemRequests.requestedDate,
      notes: itemRequests.notes,
      branch: itemRequests.branch,
    });
    
    console.log('Request created successfully:', newRequest);
    
    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating item request:", error);
    return NextResponse.json(
      { error: "Failed to create item request", details: error.message },
      { status: 500 }
    );
  }
}