import { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function checkSessionAdminPermission(req: NextRequest) {
  try {
    const session = await auth();
    
    console.log("Session check:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userRole: session?.user?.role,
      userBranch: session?.user?.branch
    });
    
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
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        branch: session.user.branch,
      }
    };
  } catch (error) {
    console.error("Error checking admin permission:", error);
    
    return {
      authorized: false,
      error: "Authentication error: " + error.message,
      status: 500
    };
  }
}