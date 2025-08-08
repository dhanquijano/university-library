import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { inventoryItems } from '@/database/schema';

// POST: Seed sample inventory items
export async function POST(req: NextRequest) {
  try {
    console.log('Seeding sample inventory items...');
    
    const sampleItems = [
      {
        name: 'Professional Hair Clippers',
        sku: 'HC-001',
        category: 'Tools',
        quantity: 15,
        reorderThreshold: 10,
        unitPrice: '2500.00',
        supplier: 'Barber Supply Co.',
        status: 'in-stock',
        branch: 'Main Branch',
      },
      {
        name: 'Hair Shampoo',
        sku: 'HS-002', 
        category: 'Hair Products',
        quantity: 8,
        reorderThreshold: 10,
        unitPrice: '350.00',
        supplier: 'Beauty Supplies Inc.',
        status: 'low-stock',
        branch: 'Main Branch',
      },
      {
        name: 'Styling Gel',
        sku: 'SG-003',
        category: 'Hair Products', 
        quantity: 0,
        reorderThreshold: 5,
        unitPrice: '280.00',
        supplier: 'Beauty Supplies Inc.',
        status: 'out-of-stock',
        branch: 'Main Branch',
      },
      {
        name: 'Disposable Razors',
        sku: 'DR-004',
        category: 'Tools',
        quantity: 50,
        reorderThreshold: 20,
        unitPrice: '150.00',
        supplier: 'Barber Supply Co.',
        status: 'in-stock',
        branch: 'Main Branch',
      },
      {
        name: 'Hair Conditioner',
        sku: 'HC-005',
        category: 'Hair Products',
        quantity: 12,
        reorderThreshold: 8,
        unitPrice: '380.00',
        supplier: 'Beauty Supplies Inc.',
        status: 'in-stock',
        branch: 'Main Branch',
      }
    ];

    const insertedItems = await db.insert(inventoryItems).values(sampleItems).returning();
    
    console.log(`Successfully seeded ${insertedItems.length} inventory items`);
    
    return NextResponse.json({
      message: 'Inventory items seeded successfully',
      count: insertedItems.length,
      items: insertedItems,
      success: true
    });
    
  } catch (error: any) {
    console.error('Error seeding inventory items:', error);
    return NextResponse.json({
      error: 'Failed to seed inventory items',
      details: error.message,
      success: false
    }, { status: 500 });
  }
}