import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function checkSimpleAdminPermission(req: NextRequest) {
  try {
    // Use getToken instead of auth() for API routes
    const token = await getToken({ 
      req, 
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET 
    });
    
    console.log("Token:", token);
    
    if (!token) {
      return {
        authorized: false,
        error: "Authentication required",
        status: 401
      };
    }

    // Check if user has admin or manager role
    if (token.role !== "ADMIN" && token.role !== "MANAGER" && token.role !== "STAFF") {
      return {
        authorized: false,
        error: "Admin, Manager, or Staff access required",
        status: 403
      };
    }

    return {
      authorized: true,
      user: {
        id: token.id as string,
        name: token.name as string,
        email: token.email as string,
        role: token.role as string,
        branch: token.branch as string,
      }
    };
  } catch (error) {
    console.error("Error checking admin permission:", error);
    
    return {
      authorized: false,
      error: "Authentication error",
      status: 500
    };
  }
}