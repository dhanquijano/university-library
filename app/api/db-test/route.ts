import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { purchaseOrders } from '@/database/schema';

export async function GET(req: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    // Try to fetch a single purchase order
    const orders = await db.select().from(purchaseOrders).limit(1);
    
    console.log('Database connection successful');
    
    return NextResponse.json({
      success: true,
      message: 'Database connection working',
      orderCount: orders.length
    });
    
  } catch (error) {
    console.error('Database connection failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Database connection failed'
    }, { status: 500 });
  }
} 