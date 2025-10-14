import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { suppliers } from '@/database/schema';
import { eq } from 'drizzle-orm';

// GET: List all suppliers
export async function GET() {
  try {
    const suppliersList = await db.select().from(suppliers);
    return NextResponse.json(suppliersList);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

// POST: Add a new supplier
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }
    
    const [supplier] = await db.insert(suppliers).values({
      name: data.name,
      contactPerson: data.contactPerson || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
    }).returning();
    
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}

// DELETE: Remove a supplier by name
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    
    if (!name) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }
    
    await db.delete(suppliers).where(eq(suppliers.name, name));
    
    return NextResponse.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}