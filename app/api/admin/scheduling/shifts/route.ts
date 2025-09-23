import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { staffShifts } from "@/database/schema";
import { eq, and, gte, lte } from "drizzle-orm";

type Shift = {
  id: string;
  barberId: string;
  branchId: string;
  date: string;
  startTime: string;
  endTime: string;
  breaks?: { startTime: string; endTime: string }[];
  type?: "full" | "half" | "split";
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  const barberId = searchParams.get("barberId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  try {
    let query = db.select().from(staffShifts);

    // Apply filters
    const conditions = [];
    if (branchId) conditions.push(eq(staffShifts.branchId, branchId));
    if (barberId) conditions.push(eq(staffShifts.barberId, barberId));
    if (start) conditions.push(gte(staffShifts.date, start));
    if (end) conditions.push(lte(staffShifts.date, end));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const shifts = await query;
    
    // Transform to match the expected format
    const formattedShifts = shifts.map(shift => ({
      id: shift.id,
      barberId: shift.barberId,
      branchId: shift.branchId,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breaks: shift.breaks ? JSON.parse(shift.breaks) : [],
      type: shift.type
    }));

    return NextResponse.json(formattedShifts);
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<Shift>;
  if (!body.branchId || !body.barberId || !body.date || !body.startTime || !body.endTime) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    // Check for overlapping shifts for the same barber on the same date
    const existingShifts = await db
      .select()
      .from(staffShifts)
      .where(
        and(
          eq(staffShifts.barberId, body.barberId!),
          eq(staffShifts.date, body.date!)
        )
      );

    const overlaps = existingShifts.some((s) => {
      const start = body.startTime!;
      const end = body.endTime!;
      return !(end <= s.startTime || start >= s.endTime);
    });

    if (overlaps) {
      return NextResponse.json({ error: "Overlaps with an existing shift" }, { status: 409 });
    }

    // Create new shift
    const newShift = await db
      .insert(staffShifts)
      .values({
        barberId: body.barberId!,
        branchId: body.branchId!,
        date: body.date!,
        startTime: body.startTime!,
        endTime: body.endTime!,
        breaks: body.breaks ? JSON.stringify(body.breaks) : null,
        type: (body.type as "full" | "half" | "split") || "full",
      })
      .returning();

    const formattedShift = {
      id: newShift[0].id,
      barberId: newShift[0].barberId,
      branchId: newShift[0].branchId,
      date: newShift[0].date,
      startTime: newShift[0].startTime,
      endTime: newShift[0].endTime,
      breaks: newShift[0].breaks ? JSON.parse(newShift[0].breaks) : [],
      type: newShift[0].type
    };

    return NextResponse.json(formattedShift, { status: 201 });
  } catch (error) {
    console.error("Error creating shift:", error);
    return NextResponse.json({ error: "Failed to create shift" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    await db
      .delete(staffShifts)
      .where(eq(staffShifts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting shift:", error);
    return NextResponse.json({ error: "Failed to delete shift" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as Partial<Shift> & { id: string };
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    // Get current shift
    const currentShift = await db
      .select()
      .from(staffShifts)
      .where(eq(staffShifts.id, body.id))
      .limit(1);

    if (currentShift.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const current = currentShift[0];

    // Check for overlaps with other shifts (excluding current one)
    const otherShifts = await db
      .select()
      .from(staffShifts)
      .where(
        and(
          eq(staffShifts.barberId, current.barberId),
          eq(staffShifts.date, current.date),
          // Exclude current shift using NOT equal
          // Note: We'll filter this out in the overlap check
        )
      );

    const startTime = body.startTime ?? current.startTime;
    const endTime = body.endTime ?? current.endTime;

    const overlaps = otherShifts.some((s) => {
      if (s.id === body.id) return false; // Exclude current shift
      return !(endTime <= s.startTime || startTime >= s.endTime);
    });

    if (overlaps) {
      return NextResponse.json({ error: "Overlaps with an existing shift" }, { status: 409 });
    }

    // Update the shift
    const updateData: any = {};
    if (body.startTime !== undefined) updateData.startTime = body.startTime;
    if (body.endTime !== undefined) updateData.endTime = body.endTime;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.breaks !== undefined) updateData.breaks = JSON.stringify(body.breaks);
    updateData.updatedAt = new Date();

    const updatedShift = await db
      .update(staffShifts)
      .set(updateData)
      .where(eq(staffShifts.id, body.id))
      .returning();

    const formattedShift = {
      id: updatedShift[0].id,
      barberId: updatedShift[0].barberId,
      branchId: updatedShift[0].branchId,
      date: updatedShift[0].date,
      startTime: updatedShift[0].startTime,
      endTime: updatedShift[0].endTime,
      breaks: updatedShift[0].breaks ? JSON.parse(updatedShift[0].breaks) : [],
      type: updatedShift[0].type
    };

    return NextResponse.json(formattedShift);
  } catch (error) {
    console.error("Error updating shift:", error);
    return NextResponse.json({ error: "Failed to update shift" }, { status: 500 });
  }
}


