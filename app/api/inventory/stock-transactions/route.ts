import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { stockTransactions, inventoryItems, users } from '@/database/schema';
import { eq, desc } from 'drizzle-orm';

// GET: List all stock transactions with item and user details
export async function GET(req: NextRequest) {
  try {
    console.log('Fetching stock transactions from database...');
    
    // First check if stockTransactions table exists and has data
    let transactions;
    try {
      transactions = await db.select().from(stockTransactions).orderBy(desc(stockTransactions.createdAt));
    } catch (error) {
      console.log('Stock transactions table appears to be empty or not accessible');
      return NextResponse.json([]);
    }

    if (!transactions || transactions.length === 0) {
      console.log('No stock transactions found, returning empty array');
      return NextResponse.json([]);
    }

    console.log(`Found ${transactions.length} stock transactions`);

    // Look up item names and user names for each transaction
    const formattedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        // Get item name
        let itemName = 'Unknown Item';
        try {
          const item = await db
            .select({ name: inventoryItems.name })
            .from(inventoryItems)
            .where(eq(inventoryItems.id, transaction.itemId))
            .limit(1);
          if (item && item.length > 0) {
            itemName = item[0].name;
          }
        } catch (error) {
          console.error(`Error fetching item name for ID ${transaction.itemId}:`, error);
        }

        // Get user name - handle invalid UUIDs gracefully
        let userName = 'System User';
        try {
          // Check if userId looks like a valid UUID
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(transaction.userId)) {
            const user = await db
              .select({ fullName: users.fullName })
              .from(users)
              .where(eq(users.id, transaction.userId))
              .limit(1);
            if (user && user.length > 0) {
              userName = user[0].fullName;
            }
          } else {
            // Handle non-UUID user IDs (like 'admin-user-id', 'system', etc.)
            userName = transaction.userId === 'system' ? 'System' : 'System User';
          }
        } catch (error) {
          console.error(`Error fetching user name for ID ${transaction.userId}:`, error);
          userName = 'System User';
        }

        return {
          id: transaction.id,
          itemId: transaction.itemId,
          itemName: itemName,
          type: transaction.type as 'in' | 'out',
          quantity: transaction.quantity,
          previousQuantity: transaction.previousQuantity,
          newQuantity: transaction.newQuantity,
          user: userName,
          userId: transaction.userId,
          notes: transaction.notes || '',
          reason: transaction.reason,
          branch: transaction.branch,
          timestamp: transaction.createdAt?.toISOString() || new Date().toISOString(),
        };
      })
    );

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error('Error fetching stock transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch stock transactions' }, { status: 500 });
  }
}

// POST: Add a new stock transaction
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log('Creating new stock transaction:', data);

    // Get current item quantity
    const item = await db
      .select({ quantity: inventoryItems.quantity })
      .from(inventoryItems)
      .where(eq(inventoryItems.id, data.itemId))
      .limit(1);

    if (!item || item.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const currentQuantity = item[0].quantity;
    const transactionQuantity = parseInt(data.quantity);
    const newQuantity = data.type === 'in' 
      ? currentQuantity + transactionQuantity 
      : currentQuantity - transactionQuantity;

    // Validate stock out doesn't go negative
    if (data.type === 'out' && newQuantity < 0) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    // Create the transaction record
    const [transaction] = await db.insert(stockTransactions).values({
      itemId: data.itemId,
      type: data.type,
      quantity: transactionQuantity,
      previousQuantity: currentQuantity,
      newQuantity: newQuantity,
      userId: data.userId,
      notes: data.notes || '',
      reason: data.reason,
      branch: data.branch,
    }).returning();

    // Update the item quantity
    await db
      .update(inventoryItems)
      .set({ quantity: newQuantity })
      .where(eq(inventoryItems.id, data.itemId));

    console.log('Stock transaction created successfully:', transaction.id);

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        itemId: transaction.itemId,
        type: transaction.type,
        quantity: transaction.quantity,
        previousQuantity: transaction.previousQuantity,
        newQuantity: transaction.newQuantity,
        userId: transaction.userId,
        notes: transaction.notes,
        reason: transaction.reason,
        branch: transaction.branch,
        timestamp: transaction.createdAt,
      }
    });

  } catch (error) {
    console.error('Error creating stock transaction:', error);
    return NextResponse.json({ error: 'Failed to create stock transaction' }, { status: 500 });
  }
}