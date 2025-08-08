import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { purchaseOrders, purchaseOrderItems, inventoryItems, stockTransactions } from '@/database/schema';
import { eq } from 'drizzle-orm';

// PATCH: Update a purchase order (specifically for status updates)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();
    
    console.log(`Updating purchase order ${id} with data:`, data);

    // Update the purchase order status and relevant dates
    const now = new Date();
    const updatePayload: any = {
      status: data.status,
      updatedAt: now,
    };
    if (data.status === 'ordered') {
      updatePayload.orderedDate = now;
    }
    if (data.status === 'received') {
      updatePayload.receivedDate = now;
    }

    const [updatedOrder] = await db
      .update(purchaseOrders)
      .set(updatePayload)
      .where(eq(purchaseOrders.id, id))
      .returning();

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    // If status is 'received', update inventory and create stock transactions
    if (data.status === 'received') {
      console.log('Processing received order...');
      try {
        // Get the items from the purchase order items table
        const orderItems = await db
          .select({
            itemId: purchaseOrderItems.itemId,
            itemName: purchaseOrderItems.itemName,
            quantity: purchaseOrderItems.quantity,
            unitPrice: purchaseOrderItems.unitPrice,
            totalPrice: purchaseOrderItems.totalPrice,
          })
          .from(purchaseOrderItems)
          .where(eq(purchaseOrderItems.orderId, updatedOrder.id));
        
        console.log(`Found ${orderItems.length} items for order ${updatedOrder.id}`);
        
        for (const orderItem of orderItems) {
          console.log(`Processing item: ${orderItem.itemName} (${orderItem.quantity} units)`);
          
          // Find the inventory item
          const [inventoryItem] = await db
            .select()
            .from(inventoryItems)
            .where(eq(inventoryItems.id, orderItem.itemId))
            .limit(1);

          if (inventoryItem) {
            console.log(`Found inventory item: ${inventoryItem.name}, current quantity: ${inventoryItem.quantity}`);
            
            // Update inventory quantity
            const newQuantity = inventoryItem.quantity + orderItem.quantity;
            await db
              .update(inventoryItems)
              .set({ 
                quantity: newQuantity,
                updatedAt: new Date()
              })
              .where(eq(inventoryItems.id, orderItem.itemId));

            // Create stock transaction
            await db.insert(stockTransactions).values({
              itemId: orderItem.itemId,
              type: 'in',
              quantity: orderItem.quantity,
              previousQuantity: inventoryItem.quantity,
              newQuantity: newQuantity,
              userId: updatedOrder.requestedBy,
              notes: `Received from purchase order ${updatedOrder.orderNumber}`,
              reason: 'Purchase Order Received',
              branch: updatedOrder.branch,
              createdAt: new Date(),
            });

            console.log(`Updated inventory item ${orderItem.itemId}: ${inventoryItem.quantity} -> ${newQuantity}`);
          } else {
            console.warn(`Inventory item ${orderItem.itemId} not found`);
          }
        }
        
        console.log('Inventory updated and stock transactions created successfully');
      } catch (error) {
        console.error('Error updating inventory for received order:', error);
        console.error('Error details:', {
          message: (error as any).message,
          stack: (error as any).stack,
          orderId: updatedOrder.id,
          status: data.status
        });
        // Don't fail the entire request, but log the error
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        supplier: updatedOrder.supplier,
        status: updatedOrder.status,
        totalAmount: parseFloat(updatedOrder.totalAmount),
        requestedBy: updatedOrder.requestedBy,
        requestedDate: updatedOrder.requestedDate?.toISOString(),
        orderedDate: updatedOrder.orderedDate?.toISOString(),
        receivedDate: updatedOrder.receivedDate?.toISOString(),
        notes: updatedOrder.notes,
        branch: updatedOrder.branch,
      }
    });

  } catch (error) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json(
      { error: 'Failed to update purchase order' }, 
      { status: 500 }
    );
  }
}

// GET: Get a specific purchase order by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const order = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id))
      .limit(1);

    if (!order || order.length === 0) {
      return NextResponse.json(
        { error: 'Purchase order not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(order[0]);

  } catch (error) {
    console.error('Error fetching purchase order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase order' }, 
      { status: 500 }
    );
  }
} 