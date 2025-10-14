import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ 
      req, 
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET 
    });
    
    console.log("User token:", token);
    
    return NextResponse.json({
      token,
      user: token ? {
        id: token.id,
        name: token.name,
        email: token.email,
        role: token.role,
        branch: token.branch
      } : null
    });
  } catch (error) {
    console.error("Error getting user info:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}