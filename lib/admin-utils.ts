// Utility functions for admin panel access control

export const ADMIN_ROLES = ["ADMIN", "MANAGER", "STAFF"] as const;
export type AdminRole = typeof ADMIN_ROLES[number];

/**
 * Check if a user role has access to the admin panel
 */
export const hasAdminAccess = (role: string): boolean => {
  return ADMIN_ROLES.includes(role as AdminRole);
};

/**
 * Check if a user role has full admin privileges (ADMIN only)
 */
export const isFullAdmin = (role: string): boolean => {
  return role === "ADMIN";
};

/**
 * Check if a user role has manager privileges (ADMIN or MANAGER)
 */
export const isManagerOrAbove = (role: string): boolean => {
  return role === "ADMIN" || role === "MANAGER";
};

/**
 * Get role display information
 */
export const getRoleDisplayInfo = (role: string) => {
  switch (role) {
    case "ADMIN":
      return {
        label: "Admin",
        bgColor: "bg-[#ECFDF3]",
        textColor: "text-[#027A48]",
        description: "Full system access"
      };
    case "MANAGER":
      return {
        label: "Manager",
        bgColor: "bg-[#EFF6FF]",
        textColor: "text-[#1D4ED8]",
        description: "Management access"
      };
    case "STAFF":
      return {
        label: "Staff",
        bgColor: "bg-[#FEF3C7]",
        textColor: "text-[#D97706]",
        description: "Staff access"
      };
    case "USER":
      return {
        label: "User",
        bgColor: "bg-[#FDF2FA]",
        textColor: "text-[#C11574]",
        description: "Regular user"
      };
    default:
      return {
        label: "Unknown",
        bgColor: "bg-gray-100",
        textColor: "text-gray-600",
        description: "Unknown role"
      };
  }
};

/**
 * Get admin panel navigation items based on user role
 */
export const getAdminNavItems = (role: string) => {
  const baseItems = [
    {
      img: "/icons/admin/user.svg",
      route: "/",
      text: "Return to Main",
      allowedRoles: ADMIN_ROLES
    },
    {
      img: "/icons/admin/home.svg",
      route: "/admin",
      text: "Home",
      allowedRoles: ADMIN_ROLES
    },
    {
      img: "/icons/admin/book.svg",
      route: "/admin/appointments",
      text: "All Appointments",
      allowedRoles: ADMIN_ROLES
    },
    {
      img: "/icons/admin/bookmark.svg",
      route: "/admin/inventory",
      text: "Inventory Management",
      allowedRoles: ["ADMIN", "MANAGER"] // Only admin and manager
    },
    {
      img: "/icons/admin/receipt.svg",
      route: "/admin/sales",
      text: "Sales Management",
      allowedRoles: ["ADMIN", "MANAGER"] // Only admin and manager
    },
    {
      img: "/icons/admin/calendar.svg",
      route: "/admin/scheduling",
      text: "Staff Scheduling",
      allowedRoles: ["ADMIN", "MANAGER"] // Only admin and manager
    }
  ];

  return baseItems.filter(item => item.allowedRoles.includes(role));
};
