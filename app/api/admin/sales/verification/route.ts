import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { sql } from "drizzle-orm";
import { checkAdminPermission, createUnauthorizedResponse } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  // Check admin permissions
  const authCheck = await checkAdminPermission(req);
  if (!authCheck.authorized) {
    return createUnauthorizedResponse(authCheck.error!, authCheck.status!);
  }

  try {
    // Get payment method filter from query params
    const { searchParams } = new URL(req.url);
    const paymentMethod = searchParams.get('paymentMethod');
    
    // Define verifiable payment methods
    const verifiablePaymentMethods = ['GCash', 'Maya', 'Bank Transfer'];
    
    // Build WHERE clause for payment methods
    let paymentMethodFilter = '';
    if (paymentMethod && verifiablePaymentMethods.includes(paymentMethod)) {
      paymentMethodFilter = `AND s.payment_method = '${paymentMethod}'`;
    } else {
      // Default to all verifiable payment methods
      const methodsList = verifiablePaymentMethods.map(method => `'${method}'`).join(', ');
      paymentMethodFilter = `AND s.payment_method IN (${methodsList})`;
    }

    // Fetch all verifiable transactions with their verification status
    const query = sql.raw(`
      SELECT 
        s.id,
        s.date,
        s.time,
        s.branch,
        s.barber,
        s.services,
        s.gross,
        s.discount,
        s.net,
        s.payment_method as "paymentMethod",
        s.status,
        s.receipt_url as "receiptUrl",
        s.notes,
        s.created_at as "createdAt",
        tv.id as "verificationId",
        tv.status as "verificationStatus",
        tv.verified_by as "verifiedBy",
        tv.verified_at as "verifiedAt",
        tv.rejection_reason as "rejectionReason",
        tv.created_at as "verificationCreatedAt"
      FROM sales s
      LEFT JOIN transaction_verifications tv ON s.id = tv.transaction_id
      WHERE s.receipt_url IS NOT NULL ${paymentMethodFilter}
      ORDER BY s.date DESC, s.time DESC NULLS LAST
    `);

    const result = await db.execute(query);
    const transactions = (result as any).rows ?? [];

    // Calculate verification statistics
    const stats = {
      pending: 0,
      verified: 0,
      rejected: 0,
      total: transactions.length
    };

    transactions.forEach((transaction: any) => {
      const status = transaction.verificationStatus || 'pending';
      if (status === 'pending') stats.pending++;
      else if (status === 'verified') stats.verified++;
      else if (status === 'rejected') stats.rejected++;
    });

    // Transform data to match the expected interface
    const transformedTransactions = transactions.map((transaction: any) => ({
      id: transaction.id,
      date: transaction.date,
      time: transaction.time,
      branch: transaction.branch,
      barber: transaction.barber,
      services: transaction.services,
      gross: transaction.gross,
      discount: transaction.discount,
      net: transaction.net,
      paymentMethod: transaction.paymentMethod,
      status: transaction.status,
      receiptUrl: transaction.receiptUrl,
      notes: transaction.notes,
      createdAt: transaction.createdAt,
      verification: transaction.verificationId ? {
        id: transaction.verificationId,
        status: transaction.verificationStatus,
        verifiedBy: transaction.verifiedBy,
        verifiedAt: transaction.verifiedAt,
        rejectionReason: transaction.rejectionReason,
        createdAt: transaction.verificationCreatedAt
      } : {
        status: 'pending'
      }
    }));

    return NextResponse.json({
      success: true,
      data: {
        transactions: transformedTransactions,
        stats
      }
    });

  } catch (error) {
    console.error("Error fetching verification data:", error);
    
    // Provide more specific error messages based on error type
    let errorMessage = "Failed to fetch verification data";
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