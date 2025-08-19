import { NextRequest, NextResponse } from "next/server";
import redis from "@/database/redis";

// Computes availability by subtracting shifts and leaves from branch hours
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  const barberId = searchParams.get("barberId");
  const date = searchParams.get("date");
  if (!branchId || !barberId || !date) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const shifts = ((await redis.get("scheduling:shifts")) as any[]) || [];
  const leaves = ((await redis.get("scheduling:leaves")) as any[]) || [];

  const dayShifts = shifts.filter(
    (s) => s.branchId === branchId && s.barberId === barberId && s.date === date,
  );
  const dayLeaves = leaves.filter((l) => l.barberId === barberId && l.date === date);

  return NextResponse.json({ shifts: dayShifts, leaves: dayLeaves });
}


