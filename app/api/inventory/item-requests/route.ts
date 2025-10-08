import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { sql, desc } from "drizzle-orm";
import { itemRequests } from "@/database/schema";



export async function GET(req: NextRequest) {

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const branch = searchParams.get('branch');

    let whereConditions = [];
    let params: any[] = [];

    if (status) {
      whereConditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    if (branch) {
      whereConditions.push(`branch = $${params.length + 1}`);
      params.push(branch);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const query = sql.raw(`
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
    `);

    const result = await db.execute(query);
    const requests = (result as any).rows || [];

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching item requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch item requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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

    // Generate unique request number
    const requestNumber = `REQ-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Insert the request using Drizzle schema
    const [newRequest] = await db.insert(itemRequests).values({
      requestNumber,
      status: 'pending',
      items: JSON.stringify(items),
      totalAmount: totalAmount.toString(),
      requestedBy: requestedBy || 'Manager',
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
    console.log('Items type:', typeof newRequest.items);
    console.log('Items value:', newRequest.items);
    
    // The items should already be in the correct format from the database
    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating item request:", error);
    return NextResponse.json(
      { error: "Failed to create item request" },
      { status: 500 }
    );
  }
}