import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    return NextResponse.json({
      session,
      user: session?.user,
      role: session?.user?.role,
      isAdmin: session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to get session",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}