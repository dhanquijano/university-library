import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { inventoryBranches } from '@/database/schema';
import { eq } from 'drizzle-orm';

// GET: Get a single branch by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const branchId = params.id;
    
    const [branch] = await db
      .select()
      .from(inventoryBranches)
      .where(eq(inventoryBranches.id, branchId))
      .limit(1);
    
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }
    
    return NextResponse.json(branch);
  } catch (error) {
    console.error('Error fetching branch:', error);
    return NextResponse.json({ error: 'Failed to fetch branch' }, { status: 500 });
  }
}