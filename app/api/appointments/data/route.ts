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

    // Fetch data directly from database
    const [unifiedBranches, allBarbers] = await Promise.all([
      db.select().from(inventoryBranches),
      db.select().from(barbers),
    ]);

    // Get services using the same logic as the services API
    let allServices = [];
    try {
      const dbServices = await db.select().from(servicesCatalog);
      if (dbServices && dbServices.length > 0) {
        allServices = dbServices.map((r) => ({
          id: r.id,
          category: r.category,
          title: r.title,
          description: r.description,
          price: parseFloat(r.price),
        }));
      } else {
        // Fallback to services.json
        const fs = await import('fs');
        const path = await import('path');
        const servicesFilePath = path.join(process.cwd(), 'public', 'services.json');
        allServices = JSON.parse(fs.readFileSync(servicesFilePath, 'utf8'));
      }
    } catch (error) {
      console.warn("Failed to load services:", error);
      allServices = [];
    }

    console.log("Appointment data API - Services found:", allServices.length);

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

    // Transform barbers data to expected format
    const transformedBarbers = allBarbers.map((barber: any) => {
      let specialties = [];
      let branches = [];
      
      try {
        specialties = typeof barber.specialties === 'string' 
          ? JSON.parse(barber.specialties) 
          : (Array.isArray(barber.specialties) ? barber.specialties : []);
      } catch (e) {
        console.warn(`Failed to parse specialties for barber ${barber.id}:`, barber.specialties);
        specialties = [];
      }
      
      try {
        branches = typeof barber.branches === 'string' 
          ? JSON.parse(barber.branches) 
          : (Array.isArray(barber.branches) ? barber.branches : []);
      } catch (e) {
        console.warn(`Failed to parse branches for barber ${barber.id}:`, barber.branches);
        branches = [];
      }
      
      return {
        id: barber.id,
        name: barber.name,
        specialties,
        experience: barber.experience,
        rating: parseFloat(barber.rating) || 0,
        image: barber.image,
        branches,
        createdAt: barber.createdAt
      };
    });

    // Filter barbers based on selected branch and availability requirements
    let barbersData = transformedBarbers;
    if (branchId) {
      // First, filter by branch membership
      const branchEligible = transformedBarbers.filter(
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
          category: s.category || '',
          title: s.title || '',
          description: s.description || '',
          price: String(s.price || '0'),
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
