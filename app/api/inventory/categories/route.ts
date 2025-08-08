import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { inventoryCategories } from '@/database/schema';

// GET: List all categories
export async function GET() {
  const categories = await db.select().from(inventoryCategories);
  return NextResponse.json(categories);
}

// POST: Add a new category
export async function POST(req: NextRequest) {
  const data = await req.json();
  const [category] = await db.insert(inventoryCategories).values(data).returning();
  return NextResponse.json(category);
} 