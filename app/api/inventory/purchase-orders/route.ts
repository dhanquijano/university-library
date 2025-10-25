import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { purchaseOrders, purchaseOrderItems, users } from '@/database/schema';
import { eq, desc } from 'drizzle-orm';

// GET: List all purchase orders with items  
export async function GET(req: NextRequest) {
  try {
    console.log('Fetching purchase orders from database...');
    
    // First check if purchaseOrders table exists and has data
    let orders;
    try {
      orders = await db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt));
    } catch (error) {
      console.log('Purchase orders table appears to be empty or not accessible');
      return NextResponse.json([]);
    }

    if (!orders || orders.length === 0) {
      console.log('No purchase orders found, returning empty array');
      return NextResponse.json([]);
    }

    console.log(`Found ${orders.length} purchase orders`);

    // Get items for each purchase order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db
          .select({
            itemId: purchaseOrderItems.itemId,
            itemName: purchaseOrderItems.itemName,
            quantity: purchaseOrderItems.quantity,
            unitPrice: purchaseOrderItems.unitPrice,
            totalPrice: purchaseOrderItems.totalPrice,
          })
          .from(purchaseOrderItems)
          .where(eq(purchaseOrderItems.orderId, order.id));

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          supplier: order.supplier,
          status: order.status as 'requested' | 'ordered' | 'received' | 'cancelled',
          totalAmount: parseFloat(order.totalAmount),
          requestedBy: order.requestedBy, // Use the actual requestedBy value from database
          requestedById: order.requestedBy,
          requestedDate: order.requestedDate?.toISOString() || new Date().toISOString(),
          orderedDate: order.orderedDate?.toISOString(),
          receivedDate: order.receivedDate?.toISOString(),
          notes: order.notes || '',
          branch: order.branch,
          createdAt: order.createdAt?.toISOString() || new Date().toISOString(),
          items: items.map(item => ({
            itemId: item.itemId,
            itemName: item.itemName,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: parseFloat(item.totalPrice),
          })),
        };
      })
    );

    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 });
  }
}

// POST: Create a new purchase order
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log('Creating new purchase order:', data);

    // Generate order number
    const orderNumber = `PO-${Date.now()}`;

    // Calculate total amount from items
    const totalAmount = data.items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unitPrice), 0
    );

    // Create the purchase order
    const [order] = await db.insert(purchaseOrders).values({
      orderNumber,
      supplier: data.supplier,
      status: 'requested',
      totalAmount: totalAmount.toString(),
      requestedBy: data.requestedBy,
      notes: data.notes || '',
      branch: data.branch,
    }).returning();

    // Create purchase order items
    const orderItems = await Promise.all(
      data.items.map(async (item: any) => {
        const [orderItem] = await db.insert(purchaseOrderItems).values({
          orderId: order.id,
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: (item.quantity * item.unitPrice).toString(),
        }).returning();
        
        return {
          itemId: orderItem.itemId,
          itemName: orderItem.itemName,
          quantity: orderItem.quantity,
          unitPrice: parseFloat(orderItem.unitPrice),
          totalPrice: parseFloat(orderItem.totalPrice),
        };
      })
    );

    console.log('Purchase order created successfully:', order.id);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        supplier: order.supplier,
        status: order.status,
        totalAmount: parseFloat(order.totalAmount),
        requestedBy: data.requestedBy,
        requestedDate: order.requestedDate?.toISOString(),
        notes: order.notes,
        branch: order.branch,
        items: orderItems,
      }
    });

  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 });
  }
}