import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { sql } from "drizzle-orm";
import { checkAdminPermission, createUnauthorizedResponse } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  // Check admin permissions
  const authCheck = await checkAdminPermission(req);
  if (!authCheck.authorized) {
    return createUnauthorizedResponse(authCheck.error!, authCheck.status!);
  }

  try {
    const body = await req.json();
    const { transactionId, action, reason } = body;
    
    // Use the authenticated user's info for verifiedBy
    const verifiedBy = authCheck.user!.id;

    // Validate required fields
    if (!transactionId || !action) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required fields: transactionId and action are required" 
        },
        { status: 400 }
      );
    }

    // Validate action type
    if (!['verified', 'rejected'].includes(action)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid action. Must be 'verified' or 'rejected'" 
        },
        { status: 400 }
      );
    }

    // Validate rejection reason if action is rejected
    if (action === 'rejected' && (!reason || reason.trim().length === 0)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Rejection reason is required when rejecting a transaction" 
        },
        { status: 400 }
      );
    }

    // Check if transaction exists and is a GCash transaction
    const transactionCheck = await db.execute(sql`
      SELECT id, payment_method 
      FROM sales 
      WHERE id = ${transactionId}
    `);

    if (!transactionCheck.rows || transactionCheck.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Transaction not found" 
        },
        { status: 404 }
      );
    }

    const transaction = (transactionCheck as any).rows[0];
    if (transaction.payment_method !== 'GCash') {
      return NextResponse.json(
        { 
          success: false, 
          error: "Transaction is not a GCash payment" 
        },
        { status: 400 }
      );
    }

    // Check if transaction is already verified or rejected
    const existingVerification = await db.execute(sql`
      SELECT id, status 
      FROM transaction_verifications 
      WHERE transaction_id = ${transactionId}
    `);

    const currentTime = new Date().toISOString();

    if (existingVerification.rows && existingVerification.rows.length > 0) {
      // Update existing verification record
      const existing = (existingVerification as any).rows[0];
      
      if (existing.status !== 'pending') {
        return NextResponse.json(
          { 
            success: false, 
            error: `Transaction has already been ${existing.status}` 
          },
          { status: 409 }
        );
      }

      // Update the existing record
      const updateQuery = sql`
        UPDATE transaction_verifications 
        SET 
          status = ${action}::verification_status,
          verified_by = ${verifiedBy},
          verified_at = ${currentTime}::timestamptz,
          rejection_reason = ${action === 'rejected' ? reason : null},
          updated_at = ${currentTime}::timestamptz
        WHERE transaction_id = ${transactionId}
        RETURNING id, status, verified_by as "verifiedBy", verified_at as "verifiedAt", rejection_reason as "rejectionReason"
      `;

      const updateResult = await db.execute(updateQuery);
      const updatedRecord = (updateResult as any).rows[0];

      return NextResponse.json({
        success: true,
        data: {
          transactionId,
          verification: updatedRecord
        }
      });

    } else {
      // Create new verification record
      const insertQuery = sql`
        INSERT INTO transaction_verifications (
          transaction_id, 
          status, 
          verified_by, 
          verified_at, 
          rejection_reason
        )
        VALUES (
          ${transactionId}, 
          ${action}::verification_status, 
          ${verifiedBy}, 
          ${currentTime}::timestamptz, 
          ${action === 'rejected' ? reason : null}
        )
        RETURNING id, status, verified_by as "verifiedBy", verified_at as "verifiedAt", rejection_reason as "rejectionReason"
      `;

      const insertResult = await db.execute(insertQuery);
      const newRecord = (insertResult as any).rows[0];

      return NextResponse.json({
        success: true,
        data: {
          transactionId,
          verification: newRecord
        }
      }, { status: 201 });
    }

  } catch (error) {
    console.error("Error verifying transaction:", error);
    
    // Provide more specific error messages based on error type
    let errorMessage = "Failed to verify transaction";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes("connection")) {
        errorMessage = "Database connection error. Please try again.";
        statusCode = 503;
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timeout. Please try again.";
        statusCode = 504;
      } else if (error.message.includes("permission")) {
        errorMessage = "Database permission error.";
        statusCode = 403;
      } else if (error.message.includes("constraint")) {
        errorMessage = "Data validation error. Please check the transaction details.";
        statusCode = 400;
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: statusCode }
    );
  }
}