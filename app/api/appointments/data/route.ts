import { NextRequest, NextResponse } from "next/server";
import { getAvailableDates } from "@/lib/appointment-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    // Fetch data from JSON files

    const [branchesResponse, barbersResponse, servicesResponse] =
      await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/branches.json`),
        fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/barbers.json`),
        fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/services.json`),
      ]);

    const [branches, allBarbers, services] = await Promise.all([
      branchesResponse.json(),
      barbersResponse.json(),
      servicesResponse.json(),
    ]);

    // Filter barbers based on selected branch
    let barbers = allBarbers;
    if (branchId) {
      barbers = allBarbers.filter(
        (barber: any) => barber.branches && barber.branches.includes(branchId),
      );
    }

    // Get available dates
    const availableDates = getAvailableDates();

    return NextResponse.json({
      success: true,
      data: {
        branches,
        barbers,
        services,
        availableDates,
      },
    });
  } catch (error) {
    console.error("Error fetching appointment data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointment data" },
      { status: 500 },
    );
  }
}
