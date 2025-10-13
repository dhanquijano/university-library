import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { inventoryBranches } from '@/database/schema';

// GET: List all branches using unified branch system
export async function GET() {
  try {
    // Fetch directly from database instead of making HTTP call
    const unifiedBranches = await db.select().from(inventoryBranches);
    
    // Transform to inventory format if needed
    const inventoryBranchesData = unifiedBranches.map((branch: any) => ({
      id: branch.id,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      managerId: branch.managerId,
      createdAt: branch.createdAt
    }));
    
    return NextResponse.json(inventoryBranchesData);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}

// POST: Add a new branch
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const [branch] = await db.insert(inventoryBranches).values(data).returning();
    return NextResponse.json(branch);
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
  }
} 