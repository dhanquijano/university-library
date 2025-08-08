import { NextRequest, NextResponse } from "next/server";
import { getAvailableDates } from "@/lib/appointment-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");


    const [branchesResponse, barbersResponse, servicesResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/branches/unified`),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/barbers`),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/services.json`)
    ]);


    const [unifiedBranches, allBarbers, services] = await Promise.all([
      branchesResponse.json(),
      barbersResponse.json(),
      servicesResponse.json(),
    ]);

    // Transform unified branches to appointment format
    const branches = unifiedBranches.map((branch: any) => ({
      id: branch.originalId || branch.id,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      hours: branch.hours
    }));

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
