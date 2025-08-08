import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { inventoryItems } from '@/database/schema';

// GET: List all inventory items
export async function GET() {
  try {
    const items = await db.select().from(inventoryItems);
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

// POST: Add a new inventory item
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log('Received data:', data);
    
    // Validate required fields
    if (!data.name || !data.sku || !data.category || !data.supplier || !data.branch) {
      console.log('Missing required fields:', { name: !!data.name, sku: !!data.sku, category: !!data.category, supplier: !!data.supplier, branch: !!data.branch });
      return NextResponse.json({ 
        error: 'Missing required fields: name, sku, category, supplier, branch' 
      }, { status: 400 });
    }
    
    // Create item data with proper defaults
    const itemData = {
      name: data.name,
      sku: data.sku,
      category: data.category,
      quantity: parseInt(data.quantity) || 0,
      reorderThreshold: parseInt(data.reorderThreshold) || 10,
      unitPrice: (parseFloat(data.unitPrice) || 0).toString(), // Convert to string for decimal type
      supplier: data.supplier,
      expirationDate: data.expirationDate || null,
      status: data.status || 'in-stock',
      branch: data.branch,
    };
    
    console.log('Attempting to insert item data:', itemData);
    
    const [item] = await db.insert(inventoryItems).values(itemData).returning();
    console.log('Successfully created item:', item);
    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error creating item:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({ 
      error: 'Failed to create item',
      details: error.message,
      name: error.name
    }, { status: 500 });
  }
} 