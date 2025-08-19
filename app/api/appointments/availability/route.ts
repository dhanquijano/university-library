import { NextRequest, NextResponse } from "next/server";
import { getAvailableTimeSlots } from "@/lib/appointment-utils";
import redis from "@/database/redis";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const barberId = searchParams.get('barberId');
    const branchId = searchParams.get('branchId');

    if (!date || !barberId || !branchId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    let timeSlots = await getAvailableTimeSlots(date, barberId, branchId);

    // Filter by scheduled shifts and approved leaves
    const shifts = ((await redis.get("scheduling:shifts")) as any[]) || [];
    const leaves = ((await redis.get("scheduling:leaves")) as any[]) || [];
    const dayShifts = shifts.filter((s) => s.branchId === branchId && s.barberId === barberId && s.date === date);
    const dayLeaves = leaves.filter((l) => l.barberId === barberId && l.date === date && l.status === "approved");

    const withinAnyShift = (time: string) =>
      dayShifts.some((s) => time >= s.startTime && time < s.endTime && !(s.breaks || []).some((b: any) => time >= b.startTime && time < b.endTime));
    const notOnLeave = (time: string) =>
      dayLeaves.every((l) => {
        if (!l.startTime || !l.endTime) return false; // full-day leave blocks all
        return time < l.startTime || time >= l.endTime;
      });

    timeSlots = timeSlots.map((slot) => ({
      ...slot,
      available: slot.available && withinAnyShift(slot.time) && notOnLeave(slot.time),
    }));

    return NextResponse.json({
      success: true,
      data: {
        date,
        barberId,
        branchId,
        timeSlots
      }
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check availability" },
      { status: 500 }
    );
  }
} 