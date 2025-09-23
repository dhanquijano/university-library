import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { staffLeaves } from "@/database/schema";
import { eq } from "drizzle-orm";

type Leave = {
  id: string;
  barberId: string;
  type: "vacation" | "sick" | "unpaid" | "other";
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  status: "pending" | "approved" | "denied";
  reason?: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const barberId = searchParams.get("barberId");

  try {
    let query = db.select().from(staffLeaves);
    
    if (barberId) {
      query = query.where(eq(staffLeaves.barberId, barberId));
    }

    const leaves = await query;
    
    // Transform to match the expected format
    const formattedLeaves = leaves.map(leave => ({
      id: leave.id,
      barberId: leave.barberId,
      type: leave.type,
      date: leave.date,
      startTime: leave.startTime,
      endTime: leave.endTime,
      status: leave.status,
      reason: leave.reason
    }));

    return NextResponse.json(formattedLeaves);
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return NextResponse.json({ error: "Failed to fetch leaves" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<Leave>;
  if (!body.barberId || !body.type || !body.date) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const newLeave = await db
      .insert(staffLeaves)
      .values({
        barberId: body.barberId!,
        type: body.type as "vacation" | "sick" | "unpaid" | "other",
        date: body.date!,
        startTime: body.startTime || null,
        endTime: body.endTime || null,
        status: (body.status as "pending" | "approved" | "denied") || "pending",
        reason: body.reason || null,
      })
      .returning();

    const formattedLeave = {
      id: newLeave[0].id,
      barberId: newLeave[0].barberId,
      type: newLeave[0].type,
      date: newLeave[0].date,
      startTime: newLeave[0].startTime,
      endTime: newLeave[0].endTime,
      status: newLeave[0].status,
      reason: newLeave[0].reason
    };

    return NextResponse.json(formattedLeave, { status: 201 });
  } catch (error) {
    console.error("Error creating leave:", error);
    return NextResponse.json({ error: "Failed to create leave" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as { id: string; status: Leave["status"] };
  if (!body?.id || !body?.status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  try {
    const updatedLeave = await db
      .update(staffLeaves)
      .set({
        status: body.status as "pending" | "approved" | "denied",
        updatedAt: new Date()
      })
      .where(eq(staffLeaves.id, body.id))
      .returning();

    if (updatedLeave.length === 0) {
      return NextResponse.json({ error: "Leave not found" }, { status: 404 });
    }

    const formattedLeave = {
      id: updatedLeave[0].id,
      barberId: updatedLeave[0].barberId,
      type: updatedLeave[0].type,
      date: updatedLeave[0].date,
      startTime: updatedLeave[0].startTime,
      endTime: updatedLeave[0].endTime,
      status: updatedLeave[0].status,
      reason: updatedLeave[0].reason
    };

    return NextResponse.json(formattedLeave);
  } catch (error) {
    console.error("Error updating leave:", error);
    return NextResponse.json({ error: "Failed to update leave" }, { status: 500 });
  }
}


