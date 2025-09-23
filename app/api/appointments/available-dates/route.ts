import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { staffShifts, staffLeaves } from "@/database/schema";
import { eq, and, gte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barberId = searchParams.get('barberId');
    const branchId = searchParams.get('branchId');

    if (!barberId || !branchId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    console.log(`Checking availability for barber ${barberId} at branch ${branchId}`);

    // Get shifts from database for this barber and branch, starting from today
    const barberShifts = await db
      .select()
      .from(staffShifts)
      .where(
        and(
          eq(staffShifts.barberId, barberId),
          eq(staffShifts.branchId, branchId),
          gte(staffShifts.date, todayStr)
        )
      );

    console.log(`Barber shifts found: ${barberShifts.length}`, barberShifts);

    // Get approved leaves from database for this barber
    const barberLeaves = await db
      .select()
      .from(staffLeaves)
      .where(
        and(
          eq(staffLeaves.barberId, barberId),
          eq(staffLeaves.status, "approved"),
          gte(staffLeaves.date, todayStr)
        )
      );

    console.log(`Barber leaves found: ${barberLeaves.length}`, barberLeaves);

    // Create a set of dates where barber is on leave
    const leaveDates = new Set(barberLeaves.map((leave: any) => leave.date));

    // Get unique dates where barber has shifts and is not on leave
    const availableDates = [...new Set(
      barberShifts
        .map((shift: any) => shift.date)
        .filter((date: string) => !leaveDates.has(date))
    )].sort();

    console.log(`Final available dates: ${availableDates.length}`, availableDates);

    console.log(`Available dates for barber ${barberId} at branch ${branchId}:`, availableDates);

    return NextResponse.json({
      success: true,
      data: {
        barberId,
        branchId,
        availableDates
      }
    });
  } catch (error) {
    console.error("Error getting available dates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get available dates" },
      { status: 500 }
    );
  }
}