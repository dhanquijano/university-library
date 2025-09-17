import { NextRequest, NextResponse } from "next/server";
import { getAvailableTimeSlots, generateTimeSlots } from "@/lib/appointment-utils";
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

    // If user selects no preference, expose all time slots (availability handled on assignment)
    let timeSlots = barberId === 'no_preference'
      ? generateTimeSlots().map((time) => ({ time, available: true }))
      : await getAvailableTimeSlots(date, barberId, branchId);

    // Filter by scheduled shifts and approved leaves
    const shifts = ((await redis.get("scheduling:shifts")) as any[]) || [];
    const leaves = ((await redis.get("scheduling:leaves")) as any[]) || [];
    const dayShifts = shifts.filter((s) => s.branchId === branchId && s.barberId === barberId && s.date === date);
    const dayLeaves = leaves.filter((l) => l.barberId === barberId && l.date === date && l.status === "approved");

    const withinAnyShift = (time: string) => {
      if (barberId === 'no_preference') return true;
      // If no shifts are scheduled, allow all times
      if (dayShifts.length === 0) return true;
      return dayShifts.some((s) => time >= s.startTime && time < s.endTime && !(s.breaks || []).some((b: any) => time >= b.startTime && time < b.endTime));
    };
    
    const notOnLeave = (time: string) => {
      if (barberId === 'no_preference') return true;
      return dayLeaves.every((l) => {
        if (!l.startTime || !l.endTime) return false; // full-day leave blocks all
        return time < l.startTime || time >= l.endTime;
      });
    };

    // Mark past times as unavailable if date is today (in Asia/Manila timezone)
    const manilaNow = (() => {
      const parts = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })
      );
      return parts;
    })();

    const isSameDate = (() => {
      const [y, m, d] = date.split('-').map(Number);
      return (
        manilaNow.getFullYear() === y &&
        manilaNow.getMonth() + 1 === m &&
        manilaNow.getDate() === d
      );
    })();

    const currentTimeHHMM = `${String(manilaNow.getHours()).padStart(2, '0')}:${String(manilaNow.getMinutes()).padStart(2, '0')}`;

    timeSlots = timeSlots.map((slot) => ({
      ...slot,
      available:
        (slot.available && withinAnyShift(slot.time) && notOnLeave(slot.time)) &&
        (!isSameDate || slot.time > currentTimeHHMM),
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