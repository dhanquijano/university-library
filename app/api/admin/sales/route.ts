import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { sql } from "drizzle-orm";

// Ensure table exists (serverless-friendly)
async function ensureSalesTable() {
  // Create table if it doesn't exist
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
  
  // Add receipt_url column if it doesn't exist
  try {
    // Check if column exists first
    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sales' AND column_name = 'receipt_url';
    `);
    
    if (columnCheck.rows?.length === 0) {
      await db.execute(sql`
        ALTER TABLE sales ADD COLUMN receipt_url text;
      `);
      console.log("Added receipt_url column to sales table");
    }
  } catch (error) {
    console.log("Error checking/adding receipt_url column:", error);
  }
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
    SELECT s.id, s.date, s.time, s.branch, s.barber, s.services, s.gross, s.discount, s.net,
           s.payment_method as "paymentMethod", s.status, s.is_manual as "isManual", s.notes, s.receipt_url as "receiptUrl",
           tv.status as "verificationStatus"
    FROM sales s
    LEFT JOIN transaction_verifications tv ON s.id = tv.transaction_id
    ${whereSql}
    ORDER BY s.date DESC, s.time DESC NULLS LAST
  `;
  const result = await db.execute(query);
  return NextResponse.json((result as any).rows ?? []);
}

export async function POST(req: NextRequest) {
  await ensureSalesTable();
  const body = await req.json();
  console.log("Sales API received body:", body);
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
  const receiptUrl: string | null = body.receiptUrl ?? null;

  if (!date || !branch) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  const insert = sql`
    INSERT INTO sales (id, date, time, branch, barber, services, gross, discount, net, payment_method, status, is_manual, notes, receipt_url)
    VALUES (${id}, ${date}, ${time}, ${branch}, ${barber}, ${services}, ${gross}, ${discount}, ${net}, ${paymentMethod}, ${status}, ${isManual}, ${notes}, ${receiptUrl})
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
      notes = EXCLUDED.notes,
      receipt_url = EXCLUDED.receipt_url
    RETURNING id, date, time, branch, barber, services, gross, discount, net, payment_method as "paymentMethod", status, is_manual as "isManual", notes, receipt_url as "receiptUrl";
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


