import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { sql, eq } from "drizzle-orm";
import { inventoryItems, stockTransactions } from "@/database/schema";
import { checkAdminPermission } from "@/lib/admin-auth";
import { getBranchFilterForRole } from "@/lib/admin-utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin permission and get user info
    const authResult = await checkAdminPermission(req);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { action, reviewedBy, notes, rejectionReason, fulfillmentPlan } = body;

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

    // Fulfillment plan is optional - if not provided, we'll just approve without processing transfers

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

    // Apply branch filtering for managers - they can only approve/reject requests from their branch
    const branchFilter = getBranchFilterForRole(authResult.user.role, authResult.user.branch);
    if (branchFilter.shouldFilter && branchFilter.branchCondition && request.branch !== branchFilter.branchCondition) {
      return NextResponse.json(
        { error: "You can only review item requests from your assigned branch" },
        { status: 403 }
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

    // If approved, process the fulfillment plan (if provided)
    if (action === 'approve' && fulfillmentPlan && fulfillmentPlan.length > 0) {
      try {
        console.log('Processing fulfillment plan:', JSON.stringify(fulfillmentPlan, null, 2));
        
        // Get the user ID for transactions
        let systemUserId = null;
        try {
          const reviewerQuery = sql`
            SELECT id FROM users WHERE full_name = ${reviewedBy} OR email = ${reviewedBy} LIMIT 1
          `;
          const reviewerResult = await db.execute(reviewerQuery);
          const reviewer = (reviewerResult as any).rows[0];
          
          if (reviewer) {
            systemUserId = reviewer.id;
          } else {
            const adminUsers = await db.execute(sql`
              SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1
            `);
            const adminUser = (adminUsers as any).rows[0];
            if (adminUser) {
              systemUserId = adminUser.id;
            }
          }
        } catch (userError) {
          console.log('Could not find user for transactions:', userError);
        }

        if (!systemUserId) {
          throw new Error('No admin user found to process fulfillment');
        }

        // Process each item in the fulfillment plan
        for (const planItem of fulfillmentPlan) {
          console.log(`Processing fulfillment for item: ${planItem.itemName}`);
          
          // Process stock transfers
          if (planItem.transfers && planItem.transfers.length > 0) {
            for (const transfer of planItem.transfers) {
              if (transfer.quantity > 0) {
                console.log(`Creating transfer: ${transfer.quantity} units from ${transfer.fromBranch} to ${request.branch}`);
                
                // Create stock transfer record
                const transferNumber = `TRF-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
                const transferId = `st-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                
                // Ensure stock_transfers table exists
                await db.execute(sql`
                  CREATE TABLE IF NOT EXISTS stock_transfers (
                    id TEXT PRIMARY KEY,
                    transfer_number TEXT UNIQUE NOT NULL,
                    from_branch TEXT NOT NULL,
                    to_branch TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    request_id TEXT,
                    initiated_by TEXT NOT NULL,
                    initiated_date TIMESTAMPTZ DEFAULT NOW(),
                    completed_by TEXT,
                    completed_date TIMESTAMPTZ,
                    notes TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                  )
                `);

                await db.execute(sql`
                  CREATE TABLE IF NOT EXISTS stock_transfer_items (
                    id TEXT PRIMARY KEY,
                    transfer_id TEXT NOT NULL,
                    item_id TEXT NOT NULL,
                    item_name TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    unit_price NUMERIC(10,2) NOT NULL,
                    total_price NUMERIC(10,2) NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                  )
                `);

                // Create transfer
                await db.execute(sql`
                  INSERT INTO stock_transfers (
                    id, transfer_number, from_branch, to_branch, status, request_id, 
                    initiated_by, completed_by, completed_date, notes
                  )
                  VALUES (
                    ${transferId}, ${transferNumber}, ${transfer.fromBranch}, ${request.branch}, 
                    'completed', ${id}, ${reviewedBy || 'Admin'}, ${reviewedBy || 'Admin'}, 
                    ${reviewedDate}::timestamptz, 
                    ${'Auto-transfer from approved request ' + updatedRequest.requestNumber}
                  )
                `);

                // Create transfer item
                const transferItemId = `sti-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                await db.execute(sql`
                  INSERT INTO stock_transfer_items (
                    id, transfer_id, item_id, item_name, quantity, unit_price, total_price
                  )
                  VALUES (
                    ${transferItemId}, ${transferId}, ${planItem.itemId}, ${planItem.itemName},
                    ${transfer.quantity}, ${transfer.unitPrice}, ${transfer.quantity * transfer.unitPrice}
                  )
                `);

                // Update stock levels - decrease from source branch
                await db.execute(sql`
                  UPDATE inventory_items 
                  SET quantity = quantity - ${transfer.quantity}, updated_at = NOW()
                  WHERE id = ${planItem.itemId} AND branch = ${transfer.fromBranch}
                `);

                // Create stock transaction for source branch (outgoing)
                await db.insert(stockTransactions).values({
                  itemId: planItem.itemId,
                  type: 'out',
                  quantity: transfer.quantity,
                  previousQuantity: 0, // Will be updated by trigger if available
                  newQuantity: 0, // Will be updated by trigger if available
                  userId: systemUserId,
                  notes: `Transfer to ${request.branch} - Request ${updatedRequest.requestNumber}`,
                  reason: 'Stock Transfer Out',
                  branch: transfer.fromBranch,
                });

                // Update stock levels - increase in target branch
                const targetItems = await db.execute(sql`
                  SELECT quantity FROM inventory_items 
                  WHERE id = ${planItem.itemId} AND branch = ${request.branch}
                `);

                if ((targetItems as any).rows.length > 0) {
                  // Item exists in target branch, update quantity
                  await db.execute(sql`
                    UPDATE inventory_items 
                    SET quantity = quantity + ${transfer.quantity}, updated_at = NOW()
                    WHERE id = ${planItem.itemId} AND branch = ${request.branch}
                  `);
                } else {
                  // Item doesn't exist in target branch, create it
                  const sourceItem = await db.execute(sql`
                    SELECT * FROM inventory_items 
                    WHERE id = ${planItem.itemId} AND branch = ${transfer.fromBranch}
                    LIMIT 1
                  `);

                  if ((sourceItem as any).rows.length > 0) {
                    const item = (sourceItem as any).rows[0];
                    await db.execute(sql`
                      INSERT INTO inventory_items (
                        id, name, sku, category, quantity, reorder_threshold, unit_price,
                        supplier, expiration_date, status, branch, created_at, updated_at
                      )
                      VALUES (
                        ${crypto.randomUUID()}, ${item.name}, ${item.sku + '-' + request.branch}, 
                        ${item.category}, ${transfer.quantity}, ${item.reorder_threshold}, 
                        ${item.unit_price}, ${item.supplier}, ${item.expiration_date}, 
                        'in-stock', ${request.branch}, NOW(), NOW()
                      )
                    `);
                  }
                }

                // Create stock transaction for target branch (incoming)
                await db.insert(stockTransactions).values({
                  itemId: planItem.itemId,
                  type: 'in',
                  quantity: transfer.quantity,
                  previousQuantity: 0, // Will be updated by trigger if available
                  newQuantity: 0, // Will be updated by trigger if available
                  userId: systemUserId,
                  notes: `Transfer from ${transfer.fromBranch} - Request ${updatedRequest.requestNumber}`,
                  reason: 'Stock Transfer In',
                  branch: request.branch,
                });

                console.log(`Completed transfer: ${transfer.quantity} units of ${planItem.itemName} from ${transfer.fromBranch} to ${request.branch}`);
              }
            }
          }

          // Process purchase order for remaining quantity
          if (planItem.purchaseOrderQuantity > 0) {
            console.log(`Creating purchase order for ${planItem.purchaseOrderQuantity} units of ${planItem.itemName}`);
            
            // Create or find existing purchase order for this request
            let purchaseOrderId = `po-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const orderNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

            // Ensure purchase_orders table exists
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

            // Create purchase order
            const totalAmount = planItem.purchaseOrderQuantity * planItem.purchaseOrderPrice;
            await db.execute(sql`
              INSERT INTO purchase_orders (
                id, order_number, supplier, status, total_amount, requested_by,
                requested_date, ordered_date, notes, branch
              )
              VALUES (
                ${purchaseOrderId}, ${orderNumber}, 'General Supplier', 'ordered',
                ${totalAmount}, ${request.requested_by}, ${request.requested_date || new Date().toISOString()},
                ${reviewedDate}::timestamptz, 
                ${'Auto-generated from approved request ' + updatedRequest.requestNumber + '. ' + (notes || '')},
                ${request.branch}
              )
            `);

            // Create purchase order item
            const poItemId = `poi-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            await db.execute(sql`
              INSERT INTO purchase_order_items (
                id, order_id, item_id, item_name, quantity, unit_price, total_price
              )
              VALUES (
                ${poItemId}, ${purchaseOrderId}, ${planItem.itemId}, ${planItem.itemName},
                ${planItem.purchaseOrderQuantity}, ${planItem.purchaseOrderPrice}, ${totalAmount}
              )
            `);

            // Update stock for purchased items (simulate immediate receipt for now)
            const targetItems = await db.execute(sql`
              SELECT quantity FROM inventory_items 
              WHERE id = ${planItem.itemId} AND branch = ${request.branch}
            `);

            if ((targetItems as any).rows.length > 0) {
              await db.execute(sql`
                UPDATE inventory_items 
                SET quantity = quantity + ${planItem.purchaseOrderQuantity}, updated_at = NOW()
                WHERE id = ${planItem.itemId} AND branch = ${request.branch}
              `);
            }

            // Create stock transaction for purchase
            await db.insert(stockTransactions).values({
              itemId: planItem.itemId,
              type: 'in',
              quantity: planItem.purchaseOrderQuantity,
              previousQuantity: 0,
              newQuantity: 0,
              userId: systemUserId,
              notes: `Purchase order ${orderNumber} - Request ${updatedRequest.requestNumber}`,
              reason: 'Purchase Order',
              branch: request.branch,
            });

            console.log(`Created purchase order ${orderNumber} for ${planItem.purchaseOrderQuantity} units of ${planItem.itemName}`);
          }
        }

        console.log(`Successfully processed fulfillment plan for request ${updatedRequest.requestNumber}`);
      } catch (fulfillmentError) {
        console.error("Error processing fulfillment plan:", fulfillmentError);
        console.error("Fulfillment error details:", fulfillmentError);
        // Don't fail the approval if fulfillment processing fails, but log the error
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin permission and get user info
    const authResult = await checkAdminPermission(req);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { id } = await params;

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

    // Apply branch filtering for managers - they can only view requests from their branch
    const branchFilter = getBranchFilterForRole(authResult.user.role, authResult.user.branch);
    if (branchFilter.shouldFilter && branchFilter.branchCondition && request.branch !== branchFilter.branchCondition) {
      return NextResponse.json(
        { error: "You can only view item requests from your assigned branch" },
        { status: 403 }
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