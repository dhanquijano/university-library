import { NextRequest, NextResponse } from "next/server";
import { getAvailableDates } from "@/lib/appointment-utils";
import redis from "@/database/redis";
import { db } from "@/database/drizzle";
import { inventoryBranches, barbers, servicesCatalog } from "@/database/schema";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const includeAll = searchParams.get("includeAll") === "true";

    // Fetch data directly from database instead of making HTTP calls
    const [unifiedBranches, allBarbers, allServices] = await Promise.all([
      db.select().from(inventoryBranches),
      db.select().from(barbers),
      db.select().from(servicesCatalog),
    ]);

    // Transform unified branches to appointment format
    const branchesData = unifiedBranches.map((branch: any) => ({
      id: branch.originalId || branch.id,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      hours: branch.hours
    }));

    // Get available dates
    const availableDates = getAvailableDates();
    console.log("Available dates from API:", availableDates);

    // Filter barbers based on selected branch and availability requirements
    let barbersData = allBarbers;
    if (branchId) {
      // First, filter by branch membership
      const branchEligible = allBarbers.filter(
        (barber: any) => barber.branches && barber.branches.includes(branchId),
      );

      if (includeAll) {
        // Return ALL barbers for this branch, regardless of availability
        barbersData = branchEligible;
      } else {
        // Original behavior: only return barbers with scheduled shifts
        let shifts: any[] = [];
        
        try {
          if (redis) {
            shifts = ((await redis.get("scheduling:shifts")) as any[]) || [];
          }
        } catch (error) {
          console.warn("Failed to get shifts from Redis:", error);
          // Fallback: return all eligible barbers if Redis is unavailable
          barbersData = branchEligible;
        }
        
        if (shifts.length > 0) {
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

          barbersData = branchEligible.filter((b: any) => scheduledBarberIds.has(b.id));
        } else {
          // If no shifts data, return all eligible barbers
          barbersData = branchEligible;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        branches: branchesData,
        barbers: barbersData,
        services: allServices.map((s: any) => ({
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
