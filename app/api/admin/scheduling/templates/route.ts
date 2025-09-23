import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { shiftTemplates } from "@/database/schema";
import { eq } from "drizzle-orm";

type Template = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
};

export async function GET() {
  try {
    const templates = await db.select().from(shiftTemplates);
    
    // Transform to match the expected format
    const formattedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name,
      startTime: template.startTime,
      endTime: template.endTime,
      breakStart: template.breakStart,
      breakEnd: template.breakEnd
    }));

    // If no templates exist, return default ones
    if (formattedTemplates.length === 0) {
      const defaultTemplates = [
        { id: "550e8400-e29b-41d4-a716-446655440001", name: "Full Day (10-10)", startTime: "10:00", endTime: "22:00", breakStart: "13:00", breakEnd: "14:00" },
        { id: "550e8400-e29b-41d4-a716-446655440002", name: "Half Day (12-5)", startTime: "12:00", endTime: "17:00" },
      ];
      return NextResponse.json(defaultTemplates);
    }

    return NextResponse.json(formattedTemplates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    // Return default templates as fallback
    const defaultTemplates = [
      { id: "550e8400-e29b-41d4-a716-446655440001", name: "Full Day (10-10)", startTime: "10:00", endTime: "22:00", breakStart: "13:00", breakEnd: "14:00" },
      { id: "550e8400-e29b-41d4-a716-446655440002", name: "Half Day (12-5)", startTime: "12:00", endTime: "17:00" },
    ];
    return NextResponse.json(defaultTemplates);
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Omit<Template, "id"> & { id?: string };
  
  try {
    const newTemplate = await db
      .insert(shiftTemplates)
      .values({
        id: body.id || crypto.randomUUID(),
        name: body.name,
        startTime: body.startTime,
        endTime: body.endTime,
        breakStart: body.breakStart || null,
        breakEnd: body.breakEnd || null,
      })
      .returning();

    const formattedTemplate = {
      id: newTemplate[0].id,
      name: newTemplate[0].name,
      startTime: newTemplate[0].startTime,
      endTime: newTemplate[0].endTime,
      breakStart: newTemplate[0].breakStart,
      breakEnd: newTemplate[0].breakEnd
    };

    return NextResponse.json(formattedTemplate, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}


