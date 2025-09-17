import { NextRequest, NextResponse } from "next/server";
import { getAvailableDates } from "@/lib/appointment-utils";
import redis from "@/database/redis";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");


  const [branchesResponse, barbersResponse, servicesResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/branches/unified`),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/barbers`),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/services`)
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

    // Get available dates
    const availableDates = getAvailableDates();

    // Filter barbers based on selected branch and actual scheduled shifts in the next 30 days
    let barbers = allBarbers;
    if (branchId) {
      // First, filter by branch membership
      const branchEligible = allBarbers.filter(
        (barber: any) => barber.branches && barber.branches.includes(branchId),
      );

      // Then, cross-check with shifts from Redis; include only those with any shift on any available date for this branch
      const shifts = ((await redis.get("scheduling:shifts")) as any[]) || [];
      const availableDateSet = new Set(availableDates);
      const scheduledBarberIds = new Set(
        shifts
          .filter(
            (s: any) =>
              s.branchId === branchId &&
              s.barberId &&
              s.date &&
              availableDateSet.has(s.date),
          )
          .map((s: any) => s.barberId),
      );

      barbers = branchEligible.filter((b: any) => scheduledBarberIds.has(b.id));
    }

  return NextResponse.json({
      success: true,
      data: {
        branches,
        barbers,
        services: services.map((s: any) => ({
          category: s.category,
          title: s.title,
          description: s.description,
          price: String(s.price),
        })),
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
