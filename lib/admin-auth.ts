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
    
    // If it's a session refresh issue, return a more specific error
    if (error instanceof Error && error.message.includes("session")) {
      return {
        authorized: false,
        error: "Session refresh in progress. Please try again.",
        status: 401
      };
    }
    
    return {
      authorized: false,
      error: "Authentication error",
      status: 500
    };
  }
}

export async function checkAdminOnlyPermission(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return {
        authorized: false,
        error: "Authentication required",
        status: 401
      };
    }

    // Check if user has ADMIN role specifically
    if (session.user.role !== "ADMIN") {
      return {
        authorized: false,
        error: "ADMIN role required for this operation",
        status: 403
      };
    }

    return {
      authorized: true,
      user: session.user
    };
  } catch (error) {
    console.error("Error checking admin-only permission:", error);
    
    // If it's a session refresh issue, return a more specific error
    if (error instanceof Error && error.message.includes("session")) {
      return {
        authorized: false,
        error: "Session refresh in progress. Please try again.",
        status: 401
      };
    }
    
    return {
      authorized: false,
      error: "Authentication error",
      status: 500
    };
  }
}

export async function getUserWithBranch(userId: string) {
  try {
    const { db } = await import("@/database/drizzle");
    const { users } = await import("@/database/schema");
    const { eq } = await import("drizzle-orm");
    
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user[0] || null;
  } catch (error) {
    console.error("Error fetching user with branch:", error);
    return null;
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