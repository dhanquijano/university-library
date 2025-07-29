import { NextRequest, NextResponse } from "next/server";
import { getAvailableTimeSlots } from "@/lib/appointment-utils";

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

    const timeSlots = await getAvailableTimeSlots(date, barberId, branchId);

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