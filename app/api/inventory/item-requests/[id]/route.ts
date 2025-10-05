import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { sql } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { action, reviewedBy, notes, rejectionReason } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required when rejecting" },
        { status: 400 }
      );
    }

    // Check if request exists and is pending
    const checkQuery = sql`
      SELECT id, status, items, branch, total_amount, requested_by
      FROM item_requests 
      WHERE id = ${id}
    `;

    const checkResult = await db.execute(checkQuery);
    const request = (checkResult as any).rows[0];

    if (!request) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (request.status !== 'pending') {
      return NextResponse.json(
        { error: "Request has already been reviewed" },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const reviewedDate = new Date().toISOString();

    // Update the request status
    const updateQuery = sql`
      UPDATE item_requests 
      SET 
        status = ${newStatus},
        reviewed_by = ${reviewedBy || 'Admin'},
        reviewed_date = ${reviewedDate}::timestamptz,
        notes = COALESCE(${notes}, notes),
        rejection_reason = ${action === 'reject' ? rejectionReason : null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING 
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
        branch
    `;

    const updateResult = await db.execute(updateQuery);
    const updatedRequest = (updateResult as any).rows[0];

    // If approved, create a purchase order
    if (action === 'approve') {
      try {
        const purchaseOrderId = `po-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const orderNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

        // Get items and determine supplier
        const items = JSON.parse(request.items);
        const supplier = items.length > 0 ? "General Supplier" : "Unknown Supplier";

        // First, ensure the purchase_orders table exists
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS purchase_orders (
            id TEXT PRIMARY KEY,
            order_number TEXT UNIQUE NOT NULL,
            supplier TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'requested',
            total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
            requested_by TEXT NOT NULL,
            requested_date TIMESTAMPTZ DEFAULT NOW(),
            ordered_date TIMESTAMPTZ,
            received_date TIMESTAMPTZ,
            notes TEXT,
            branch TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);

        // Create the purchase order
        const createPOQuery = sql`
          INSERT INTO purchase_orders (
            id,
            order_number,
            supplier,
            status,
            total_amount,
            requested_by,
            requested_date,
            ordered_date,
            notes,
            branch
          )
          VALUES (
            ${purchaseOrderId},
            ${orderNumber},
            ${supplier},
            'ordered',
            ${request.total_amount},
            ${request.requested_by},
            ${request.requested_date || new Date().toISOString()},
            ${reviewedDate}::timestamptz,
            ${`Auto-generated from approved request ${updatedRequest.requestNumber}. ${notes || ''}`},
            ${request.branch}
          )
        `;

        await db.execute(createPOQuery);

        // Create purchase order items if table exists
        try {
          await db.execute(sql`
            CREATE TABLE IF NOT EXISTS purchase_order_items (
              id TEXT PRIMARY KEY,
              order_id TEXT NOT NULL,
              item_id TEXT NOT NULL,
              item_name TEXT NOT NULL,
              quantity INTEGER NOT NULL,
              unit_price NUMERIC(10,2) NOT NULL,
              total_price NUMERIC(10,2) NOT NULL,
              created_at TIMESTAMPTZ DEFAULT NOW()
            )
          `);

          // Insert items
          for (const item of items) {
            const itemId = `poi-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            await db.execute(sql`
              INSERT INTO purchase_order_items (
                id, order_id, item_id, item_name, quantity, unit_price, total_price
              )
              VALUES (
                ${itemId}, ${purchaseOrderId}, ${item.itemId}, ${item.itemName}, 
                ${item.quantity}, ${item.unitPrice}, ${item.totalPrice}
              )
            `);
          }
        } catch (itemError) {
          console.error("Error creating purchase order items:", itemError);
        }

        console.log(`Created purchase order ${orderNumber} from approved request ${updatedRequest.requestNumber}`);
      } catch (poError) {
        console.error("Error creating purchase order:", poError);
        // Don't fail the approval if PO creation fails
      }
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: `Request ${action}d successfully`
    });

  } catch (error) {
    console.error("Error updating item request:", error);
    return NextResponse.json(
      { error: "Failed to update item request" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const query = sql`
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
      WHERE id = ${id}
    `;

    const result = await db.execute(query);
    const request = (result as any).rows[0];

    if (!request) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("Error fetching item request:", error);
    return NextResponse.json(
      { error: "Failed to fetch item request" },
      { status: 500 }
    );
  }
}