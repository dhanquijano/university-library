import { NextRequest, NextResponse } from "next/server";
import redis from "@/database/redis";

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

const SHIFTS_KEY = "scheduling:shifts";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  const barberId = searchParams.get("barberId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const all = ((await redis.get(SHIFTS_KEY)) as Shift[]) || [];

  const filtered = all.filter((s) => {
    if (branchId && s.branchId !== branchId) return false;
    if (barberId && s.barberId !== barberId) return false;
    if (start && s.date < start) return false;
    if (end && s.date > end) return false;
    return true;
  });

  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<Shift>;
  if (!body.branchId || !body.barberId || !body.date || !body.startTime || !body.endTime) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const existing = ((await redis.get(SHIFTS_KEY)) as Shift[]) || [];
  // Prevent overlapping shifts for the same barber on the same date
  const overlaps = existing.some((s) => {
    if (s.barberId !== body.barberId || s.date !== body.date) return false;
    const start = body.startTime!;
    const end = body.endTime!;
    return !(end <= s.startTime || start >= s.endTime);
  });
  if (overlaps) {
    return NextResponse.json({ error: "Overlaps with an existing shift" }, { status: 409 });
  }
  const newShift: Shift = {
    id: crypto.randomUUID(),
    breaks: [],
    type: body.type || "full",
    ...body,
  } as Shift;
  await redis.set(SHIFTS_KEY, [...existing, newShift]);
  return NextResponse.json(newShift, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const existing = ((await redis.get(SHIFTS_KEY)) as Shift[]) || [];
  const updated = existing.filter((s) => s.id !== id);
  await redis.set(SHIFTS_KEY, updated);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as Partial<Shift> & { id: string };
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const existing = ((await redis.get(SHIFTS_KEY)) as Shift[]) || [];
  const index = existing.findIndex((s) => s.id === body.id);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const current = existing[index];
  const updated: Shift = {
    ...current,
    startTime: body.startTime ?? current.startTime,
    endTime: body.endTime ?? current.endTime,
    type: body.type ?? current.type,
    breaks: body.breaks ?? current.breaks ?? [],
  };

  // Overlap check for same barber/date, excluding itself
  const overlaps = existing.some((s) => {
    if (s.id === updated.id) return false;
    if (s.barberId !== updated.barberId || s.date !== updated.date) return false;
    return !(updated.endTime <= s.startTime || updated.startTime >= s.endTime);
  });
  if (overlaps) {
    return NextResponse.json({ error: "Overlaps with an existing shift" }, { status: 409 });
  }

  const newList = [...existing];
  newList[index] = updated;
  await redis.set(SHIFTS_KEY, newList);
  return NextResponse.json(updated);
}


