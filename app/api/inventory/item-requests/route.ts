import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { sql } from "drizzle-orm";

// Ensure the item_requests table exists
async function ensureItemRequestsTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS item_requests (
        id TEXT PRIMARY KEY,
        request_number TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        items JSONB NOT NULL,
        total_amount NUMERIC(10,2) NOT NULL,
        requested_by TEXT NOT NULL,
        requested_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reviewed_by TEXT,
        reviewed_date TIMESTAMPTZ,
        notes TEXT,
        rejection_reason TEXT,
        branch TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create index on status for faster queries
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_item_requests_status ON item_requests(status)
    `);

    // Create index on branch for filtering
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_item_requests_branch ON item_requests(branch)
    `);

    console.log("Item requests table ensured");
  } catch (error) {
    console.error("Error ensuring item requests table:", error);
  }
}

export async function GET(req: NextRequest) {
  await ensureItemRequestsTable();

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
  await ensureItemRequestsTable();

  try {
    const body = await req.json();
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

    // Generate unique request ID and number
    const id = `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const requestNumber = `REQ-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Insert the request
    const insertQuery = sql`
      INSERT INTO item_requests (
        id, 
        request_number, 
        status, 
        items, 
        total_amount, 
        requested_by, 
        notes, 
        branch
      )
      VALUES (
        ${id}, 
        ${requestNumber}, 
        'pending', 
        ${JSON.stringify(items)}, 
        ${totalAmount}, 
        ${requestedBy || 'Manager'}, 
        ${notes || null}, 
        ${branch}
      )
      RETURNING 
        id,
        request_number as "requestNumber",
        status,
        items,
        total_amount as "totalAmount",
        requested_by as "requestedBy",
        requested_date as "requestedDate",
        notes,
        branch
    `;

    const result = await db.execute(insertQuery);
    const newRequest = (result as any).rows[0];

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating item request:", error);
    return NextResponse.json(
      { error: "Failed to create item request" },
      { status: 500 }
    );
  }
}