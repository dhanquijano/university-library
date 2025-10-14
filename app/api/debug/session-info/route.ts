import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    console.log("Getting session info...");
    
    const session = await auth();
    console.log("Session:", session);
    
    return NextResponse.json({
      session,
      user: session?.user || null,
      hasSession: !!session,
      userRole: session?.user?.role || null,
      userBranch: session?.user?.branch || null
    });
  } catch (error) {
    console.error("Error getting session info:", error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}