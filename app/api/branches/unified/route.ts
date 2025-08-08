import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { inventoryBranches } from '@/database/schema';
import fs from 'fs';
import path from 'path';

// GET: Unified branch endpoint that reads from database first, falls back to JSON
export async function GET(req: NextRequest) {
  try {
    let unifiedBranches;
    
    try {
      // Try to read from database first
      const dbBranches = await db.select().from(inventoryBranches);
      
      if (dbBranches && dbBranches.length > 0) {
        console.log(`Found ${dbBranches.length} branches in database`);
        
        // Transform database branches to unified format
        unifiedBranches = dbBranches.map((branch: any) => ({
          id: branch.id,
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
          hours: branch.hours || "9:00 AM - 8:00 PM", // Default hours if not set (most branches now have real hours)
          managerId: branch.managerId,
          createdAt: branch.createdAt,
          // Keep original appointment format for backward compatibility
          originalId: branch.id
        }));
      } else {
        throw new Error('No branches found in database');
      }
      
    } catch (dbError) {
      console.log('Database not available, falling back to JSON file');
      
      // Fallback to branches.json if database fails
      const branchesFilePath = path.join(process.cwd(), 'public', 'branches.json');
      const branchesData = JSON.parse(fs.readFileSync(branchesFilePath, 'utf8'));
      
      unifiedBranches = branchesData.map((branch: any) => ({
        id: branch.id,
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        hours: branch.hours,
        managerId: null,
        createdAt: new Date().toISOString(),
        originalId: branch.id
      }));
    }
    
    return NextResponse.json(unifiedBranches);
  } catch (error) {
    console.error('Error fetching unified branches:', error);
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}