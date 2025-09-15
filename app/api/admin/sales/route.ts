import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { sql } from "drizzle-orm";

// Ensure table exists (serverless-friendly)
async function ensureSalesTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sales (
      id text PRIMARY KEY,
      date date NOT NULL,
      time varchar(10),
      branch text NOT NULL,
      barber text,
      services text,
      gross numeric(10,2) NOT NULL DEFAULT 0,
      discount numeric(10,2) NOT NULL DEFAULT 0,
      net numeric(10,2) NOT NULL DEFAULT 0,
      payment_method text NOT NULL,
      status text NOT NULL,
      is_manual boolean DEFAULT true,
      notes text,
      created_at timestamptz DEFAULT now()
    );
  `);
}

type PaymentMethod = "Cash" | "GCash" | "Maya" | "Bank Transfer" | "Card" | "Unknown";

export async function GET(req: NextRequest) {
  await ensureSalesTable();
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const branch = searchParams.get("branch");

  const clauses: any[] = [];
  if (start && end) {
    clauses.push(sql`date BETWEEN ${start} AND ${end}`);
  }
  if (branch) {
    clauses.push(sql`branch = ${branch}`);
  }

  const whereSql = clauses.length ? sql`WHERE ${sql.join(clauses, sql` AND `)}` : sql``;
  const query = sql`
    SELECT id, date, time, branch, barber, services, gross, discount, net,
           payment_method as "paymentMethod", status, is_manual as "isManual", notes
    FROM sales
    ${whereSql}
    ORDER BY date DESC, time DESC NULLS LAST
  `;
  const result = await db.execute(query);
  return NextResponse.json((result as any).rows ?? []);
}

export async function POST(req: NextRequest) {
  await ensureSalesTable();
  const body = await req.json();
  const id: string = body.id || `m-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const date: string = body.date;
  const time: string | null = body.time ?? null;
  const branch: string = body.branch;
  const barber: string | null = body.barber ?? null;
  const services: string = body.services ?? '';
  const gross: number = Number(body.gross) || 0;
  const discount: number = Number(body.discount) || 0;
  const net: number = Number(body.net) || Math.max(0, gross - discount);
  const paymentMethod: PaymentMethod = body.paymentMethod || 'Cash';
  const status: string = body.status || 'completed';
  const isManual: boolean = body.isManual ?? true;
  const notes: string | null = body.notes ?? null;

  if (!date || !branch) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  const insert = sql`
    INSERT INTO sales (id, date, time, branch, barber, services, gross, discount, net, payment_method, status, is_manual, notes)
    VALUES (${id}, ${date}, ${time}, ${branch}, ${barber}, ${services}, ${gross}, ${discount}, ${net}, ${paymentMethod}, ${status}, ${isManual}, ${notes})
    ON CONFLICT (id) DO UPDATE SET
      date = EXCLUDED.date,
      time = EXCLUDED.time,
      branch = EXCLUDED.branch,
      barber = EXCLUDED.barber,
      services = EXCLUDED.services,
      gross = EXCLUDED.gross,
      discount = EXCLUDED.discount,
      net = EXCLUDED.net,
      payment_method = EXCLUDED.payment_method,
      status = EXCLUDED.status,
      is_manual = EXCLUDED.is_manual,
      notes = EXCLUDED.notes
    RETURNING id, date, time, branch, barber, services, gross, discount, net, payment_method as "paymentMethod", status, is_manual as "isManual", notes;
  `;
  const result = await db.execute(insert);
  return NextResponse.json(result.rows?.[0] ?? null, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  await ensureSalesTable();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });
  await db.execute(sql`DELETE FROM sales WHERE id = ${id}`);
  return new NextResponse(null, { status: 204 });
}


