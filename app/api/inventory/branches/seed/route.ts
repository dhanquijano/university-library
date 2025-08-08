import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { inventoryBranches } from '@/database/schema';
import fs from 'fs';
import path from 'path';

// POST: Seed branches from branches.json to sync with appointment system
export async function POST(req: NextRequest) {
  try {
    // Read branch data from the same file used by appointments
    const branchesFilePath = path.join(process.cwd(), 'public', 'branches.json');
    const branchesData = JSON.parse(fs.readFileSync(branchesFilePath, 'utf8'));
    
    // Transform appointment branch data to inventory branch format
    const sampleBranches = branchesData.map((branch: any) => ({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      // Note: We're not setting managerId or hours here to avoid schema issues
    }));

    const insertedBranches = await db.insert(inventoryBranches).values(sampleBranches).returning();
    console.log('Seeded branches:', insertedBranches);
    
    return NextResponse.json({ 
      message: 'Branches seeded successfully',
      branches: insertedBranches 
    });
  } catch (error: any) {
    console.error('Error seeding branches:', error);
    return NextResponse.json({ 
      error: 'Failed to seed branches',
      details: error.message 
    }, { status: 500 });
  }
} 