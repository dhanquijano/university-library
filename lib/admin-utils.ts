import { useSession } from "next-auth/react";
import React from "react";

/**
 * Client-side hook to check if the current user has admin role
 * @returns Object with admin status and loading state
 */
export function useAdminRole() {
  const { data: session, status } = useSession();
  
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER" || session?.user?.role === "STAFF";
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  
  // Handle session refresh scenarios
  const isRefreshing = status === "loading" && session === undefined;
  
  return {
    isAdmin,
    isLoading,
    isAuthenticated,
    isRefreshing,
    user: session?.user,
    userRole: session?.user?.role,
    userBranch: session?.user?.branch,
  };
}

/**
 * Client-side hook to check if the current user has ADMIN role specifically
 * @returns Object with admin-only status and loading state
 */
export function useAdminOnlyRole() {
  const { data: session, status } = useSession();
  
  const isAdminOnly = session?.user?.role === "ADMIN";
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  
  // Handle session refresh scenarios
  const isRefreshing = status === "loading" && session === undefined;
  
  return {
    isAdminOnly,
    isLoading,
    isAuthenticated,
    isRefreshing,
    user: session?.user,
    userRole: session?.user?.role,
    userBranch: session?.user?.branch,
  };
}

/**
 * Utility function to check if a user object has admin role
 * @param user - User object from session
 * @returns boolean indicating if user is admin
 */
export function isUserAdmin(user: any): boolean {
  return user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "STAFF";
}

/**
 * Server-side function to check if a user role has admin access
 * @param role - User role string
 * @returns boolean indicating if role has admin access
 */
export function hasAdminAccess(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "MANAGER" || role === "STAFF";
}

/**
 * Server-side function to check if a user role has ADMIN-only access
 * @param role - User role string
 * @returns boolean indicating if role is specifically ADMIN
 */
export function hasAdminOnlyAccess(role: string | null | undefined): boolean {
  return role === "ADMIN";
}

/**
 * Get navigation items based on user role
 * @param role - User role string
 * @returns Array of navigation items
 */
export function getAdminNavItems(role: string) {
  const baseItems = [
    {
      img: "/icons/admin/user.svg",
      route: "/",
      text: "Return to Main",
    },
    {
      img: "/icons/admin/home.svg",
      route: "/admin",
      text: "Home",
    },
    {
      img: "/icons/admin/book.svg",
      route: "/admin/appointments",
      text: "All Appointments",
    },
    {
      img: "/icons/admin/bookmark.svg",
      route: "/admin/inventory",
      text: "Inventory Management",
    },
    {
      img: "/icons/admin/receipt.svg",
      route: "/admin/sales",
      text: "Sales Management",
    },
    {
      img: "/icons/admin/calendar.svg",
      route: "/admin/scheduling",
      text: "Staff Scheduling",
    },
  ];

  // For now, all admin roles get the same navigation items
  // This can be extended in the future to filter based on specific roles
  if (role === "ADMIN" || role === "MANAGER") {
    return baseItems;
  }

  // Return limited items for other roles
  return baseItems.filter(item => 
    item.route === "/" || 
    item.route === "/admin" || 
    item.route === "/admin/appointments"
  );
}

/**
 * Get branch filtering conditions for managers
 * @param userRole - User role
 * @param userBranch - User's assigned branch (could be ID or name)
 * @returns Object with filtering information
 */
export function getBranchFilterForRole(userRole: string, userBranch: string | null) {
  if (userRole === "ADMIN") {
    // Admins can see all branches
    return {
      shouldFilter: false,
      allowedBranches: [],
      branchCondition: null,
      branchId: null
    };
  }
  
  if (userRole === "MANAGER" && userBranch) {
    // Managers can only see their assigned branch
    return {
      shouldFilter: true,
      allowedBranches: [userBranch],
      branchCondition: userBranch,
      branchId: userBranch
    };
  }
  
  // Default: no filtering (for STAFF or users without branch assignment)
  return {
    shouldFilter: false,
    allowedBranches: [],
    branchCondition: null,
    branchId: null
  };
}

/**
 * Get the branch name from branch ID by looking up in inventory_branches table
 * @param branchId - Branch ID to look up
 * @returns Promise<string | null> - Branch name or null if not found
 */
export async function getBranchNameFromId(branchId: string): Promise<string | null> {
  try {
    const { db } = await import("@/database/drizzle");
    const { sql } = await import("drizzle-orm");
    
    const query = sql`
      SELECT name FROM inventory_branches WHERE id = ${branchId} LIMIT 1
    `;
    
    const result = await db.execute(query);
    const branch = (result as any).rows?.[0];
    
    return branch?.name || null;
  } catch (error) {
    console.error("Error fetching branch name:", error);
    return null;
  }
}

/**
 * Client-side hook to get all branches and provide branch name lookup
 * @returns Object with branch map, loading state, and lookup function
 */
export function useBranchMap() {
  const [branchMap, setBranchMap] = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/inventory/branches')
      .then(response => response.json())
      .then(branches => {
        const map: Record<string, string> = {};
        branches.forEach((branch: any) => {
          map[branch.id] = branch.name;
        });
        setBranchMap(map);
      })
      .catch(error => {
        console.error("Error fetching branches:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const getBranchName = React.useCallback((branchId: string | null | undefined): string => {
    if (!branchId) return '';
    return branchMap[branchId] || branchId;
  }, [branchMap]);

  return {
    branchMap,
    isLoading,
    getBranchName
  };
}

/**
 * Get all branches as a map of ID to name for quick lookups
 * @returns Promise<Record<string, string>> - Map of branch ID to branch name
 */
export async function getBranchMap(): Promise<Record<string, string>> {
  try {
    const response = await fetch('/api/inventory/branches');
    const branches = await response.json();
    
    const branchMap: Record<string, string> = {};
    branches.forEach((branch: any) => {
      branchMap[branch.id] = branch.name;
    });
    
    return branchMap;
  } catch (error) {
    console.error("Error fetching branch map:", error);
    return {};
  }
}

/**
 * Component wrapper that only renders children if user is admin
 */
export function AdminOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  const { isAdmin, isLoading } = useAdminRole();
  
  if (isLoading) {
    return null; // or a loading spinner
  }
  
  if (!isAdmin) {
    return React.createElement(React.Fragment, null, fallback);
  }
  
  return React.createElement(React.Fragment, null, children);
}

/**
 * Component wrapper that only renders children if user has ADMIN role specifically
 */
export function AdminOnlyRole({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  const { isAdminOnly, isLoading } = useAdminOnlyRole();
  
  if (isLoading) {
    return null; // or a loading spinner
  }
  
  if (!isAdminOnly) {
    return React.createElement(React.Fragment, null, fallback);
  }
  
  return React.createElement(React.Fragment, null, children);
}