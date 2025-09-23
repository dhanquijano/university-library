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
  
  return {
    isAdmin,
    isLoading,
    isAuthenticated,
    user: session?.user,
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