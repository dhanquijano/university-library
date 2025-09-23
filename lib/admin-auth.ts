import { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function checkAdminPermission(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return {
        authorized: false,
        error: "Authentication required",
        status: 401
      };
    }

    // Check if user has admin or manager role
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER" && session.user.role !== "STAFF") {
      return {
        authorized: false,
        error: "Admin, Manager, or Staff access required",
        status: 403
      };
    }

    return {
      authorized: true,
      user: session.user
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

export function createUnauthorizedResponse(error: string, status: number) {
  return new Response(
    JSON.stringify({
      success: false,
      error
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}