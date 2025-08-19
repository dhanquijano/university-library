import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { appointments } from '@/database/schema';

export async function GET(req: NextRequest) {
  try {
    const all = await db.select().from(appointments);
    return NextResponse.json(all);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}


