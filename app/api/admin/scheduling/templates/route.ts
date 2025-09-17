import { NextRequest, NextResponse } from "next/server";
import redis from "@/database/redis";

type Template = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
};

const KEY = "scheduling:templates";

export async function GET() {
  const templates = ((await redis.get(KEY)) as Template[]) || [
    { id: "tpl-1", name: "Full Day (10-10)", startTime: "10:00", endTime: "22:00", breakStart: "13:00", breakEnd: "14:00" },
    { id: "tpl-2", name: "Half Day (12-5)", startTime: "12:00", endTime: "17:00" },
  ];
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Omit<Template, "id"> & { id?: string };
  const current = ((await redis.get(KEY)) as Template[]) || [];
  const item: Template = { id: body.id || crypto.randomUUID(), ...body } as Template;
  await redis.set(KEY, [...current.filter((t) => t.id !== item.id), item]);
  return NextResponse.json(item, { status: 201 });
}


