import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { servicesCatalog } from '@/database/schema';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    // Try DB first
    const rows = await db.select().from(servicesCatalog);
    if (rows && rows.length > 0) {
      return NextResponse.json(rows.map((r) => ({
        id: r.id,
        category: r.category,
        title: r.title,
        description: r.description,
        price: parseFloat(r.price),
      })));
    }
  } catch (e) {
    // fall through to file
  }

  // Fallback to public/services.json for bootstrap
  try {
    const servicesFilePath = path.join(process.cwd(), 'public', 'services.json');
    const json = JSON.parse(fs.readFileSync(servicesFilePath, 'utf8'));
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const [row] = await db.insert(servicesCatalog).values({
      category: data.category,
      title: data.title,
      description: data.description || '',
      price: (parseFloat(String(data.price)) || 0).toString(),
    }).returning();
    return NextResponse.json({
      id: row.id,
      category: row.category,
      title: row.title,
      description: row.description,
      price: parseFloat(row.price),
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}


