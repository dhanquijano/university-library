import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { inventoryItems } from '@/database/schema';
import { eq } from 'drizzle-orm';

// GET: Get a single item
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, params.id));
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

// PUT: Update a single item
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    console.log('Received update data:', data);
    
    // Validate required fields (check for null, undefined, or empty string)
    const requiredFields = ['name', 'sku', 'category', 'supplier', 'branch'];
    const missingFields = requiredFields.filter(field => 
      !data[field] || (typeof data[field] === 'string' && data[field].trim() === '')
    );
    
    if (missingFields.length > 0) {
      console.log('Missing or empty required fields:', missingFields);
      console.log('Received data:', data);
      console.log('Field values:', {
        name: data.name,
        sku: data.sku,
        category: data.category,
        supplier: data.supplier,
        branch: data.branch
      });
      return NextResponse.json({ 
        error: `Missing or empty required fields: ${missingFields.join(', ')}`,
        received: Object.keys(data),
        missingFields: missingFields,
        fieldValues: {
          name: data.name,
          sku: data.sku,
          category: data.category,
          supplier: data.supplier,
          branch: data.branch
        }
      }, { status: 400 });
    }
    
    // Transform data to match database schema
    const updateData = {
      name: data.name.trim(),
      sku: data.sku.trim(),
      category: data.category.trim(),
      quantity: parseInt(data.quantity) || 0,
      reorderThreshold: parseInt(data.reorderThreshold) || 10,
      unitPrice: (parseFloat(data.unitPrice) || 0).toString(), // Convert to string for decimal type
      supplier: data.supplier.trim(),
      expirationDate: data.expirationDate && data.expirationDate.trim() !== '' ? new Date(data.expirationDate) : null,
      status: data.status || 'in-stock',
      branch: data.branch.trim(),
    };
    
    console.log('Attempting to update item with data:', updateData);
    
    const [item] = await db.update(inventoryItems).set(updateData).where(eq(inventoryItems.id, params.id)).returning();
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    console.log('Successfully updated item:', item);
    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error updating item:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({ 
      error: 'Failed to update item',
      details: error.message,
      name: error.name
    }, { status: 500 });
  }
}

// DELETE: Delete a single item
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [item] = await db.delete(inventoryItems).where(eq(inventoryItems.id, params.id)).returning();
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
} 