import { NextRequest, NextResponse } from "next/server";
import redis from "@/database/redis";

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

const KEY = "scheduling:leaves";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const barberId = searchParams.get("barberId");
  const all = ((await redis.get(KEY)) as Leave[]) || [];
  const filtered = barberId ? all.filter((l) => l.barberId === barberId) : all;
  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<Leave>;
  if (!body.barberId || !body.type || !body.date) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const exists = ((await redis.get(KEY)) as Leave[]) || [];
  const leave: Leave = {
    id: crypto.randomUUID(),
    status: body.status || "pending",
    ...body,
  } as Leave;
  await redis.set(KEY, [...exists, leave]);
  return NextResponse.json(leave, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as { id: string; status: Leave["status"] };
  if (!body?.id || !body?.status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const all = ((await redis.get(KEY)) as Leave[]) || [];
  const updated = all.map((l) => (l.id === body.id ? { ...l, status: body.status } : l));
  await redis.set(KEY, updated);
  const item = updated.find((l) => l.id === body.id);
  return NextResponse.json(item);
}


