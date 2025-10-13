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
    
    console.log(`Today's date: ${todayStr}`);
    console.log(`Current time: ${today.toISOString()}`);
    console.log(`Checking availability for barber ${barberId} at branch ${branchId}`);

    // Get shifts from database for this barber and branch, starting from today
    // Use a more explicit date comparison to ensure we don't include past dates
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
    
    console.log(`Query used: barberId=${barberId}, branchId=${branchId}, date >= ${todayStr}`);

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
    // Also ensure we only include dates that are today or in the future
    const availableDates = [...new Set(
      barberShifts
        .map((shift: any) => shift.date)
        .filter((date: string) => {
          // Double-check that the date is not in the past
          const shiftDate = new Date(date + 'T00:00:00');
          const todayDate = new Date(todayStr + 'T00:00:00');
          return shiftDate >= todayDate && !leaveDates.has(date);
        })
    )].sort();

    console.log(`Final available dates: ${availableDates.length}`, availableDates);
    
    // Log each date with comparison to today
    availableDates.forEach(date => {
      const dateObj = new Date(date + 'T00:00:00');
      const todayObj = new Date(todayStr + 'T00:00:00');
      console.log(`Date ${date}: ${dateObj >= todayObj ? 'FUTURE' : 'PAST'}`);
    });

    // Final safety check: absolutely ensure no past dates are returned
    const finalAvailableDates = availableDates.filter(date => {
      const dateObj = new Date(date + 'T00:00:00');
      const todayObj = new Date(todayStr + 'T00:00:00');
      const isFuture = dateObj >= todayObj;
      
      if (!isFuture) {
        console.log(`FILTERING OUT PAST DATE: ${date}`);
      }
      
      return isFuture;
    });

    console.log(`Final filtered available dates for barber ${barberId} at branch ${branchId}:`, finalAvailableDates);

    return NextResponse.json({
      success: true,
      data: {
        barberId,
        branchId,
        availableDates: finalAvailableDates
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