import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { suppliers } from '@/database/schema';

// GET: List all suppliers
export async function GET() {
  const suppliersList = await db.select().from(suppliers);
  return NextResponse.json(suppliersList);
}

// POST: Add a new supplier
export async function POST(req: NextRequest) {
  const data = await req.json();
  const [supplier] = await db.insert(suppliers).values(data).returning();
  return NextResponse.json(supplier);
} 