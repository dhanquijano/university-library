import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { staffShifts, staffLeaves } from "@/database/schema";

export async function GET(request: NextRequest) {
  try {
    const shifts = await db.select().from(staffShifts).limit(10);
    const leaves = await db.select().from(staffLeaves).limit(10);
    
    const totalShifts = await db.select().from(staffShifts);
    const totalLeaves = await db.select().from(staffLeaves);

    return NextResponse.json({
      success: true,
      data: {
        shifts,
        leaves,
        totalShifts: totalShifts.length,
        totalLeaves: totalLeaves.length
      }
    });
  } catch (error) {
    console.error("Error getting debug data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get debug data" },
      { status: 500 }
    );
  }
}