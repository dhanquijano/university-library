"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import dayjs from "dayjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Activity,
  BarChart2,
  Calendar,
  DollarSign,
  Download,
  Filter,
  PieChart,
  TrendingUp,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import VerificationTab from "@/components/VerificationTab";
import SalesAnalyticsDashboard from "@/components/admin/sales/SalesAnalyticsDashboard";
import BranchManagerInfo from "@/components/admin/BranchManagerInfo";
import { useAdminRole, useAdminOnlyRole } from "@/lib/admin-utils";
import { useSession } from "next-auth/react";

// Wrapper component to prevent VerificationTab from unmounting
const VerificationTabWrapper = ({
  isAdminOnly,
  adminOnlyLoading,
  onRefreshSalesData
}: {
  isAdminOnly: boolean;
  adminOnlyLoading: boolean;
  onRefreshSalesData?: () => void;
}) => {
  if (isAdminOnly) {
    return <VerificationTab key="verification-component" onRefreshSalesData={onRefreshSalesData} />;
  }

  if (adminOnlyLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-600">Only users with ADMIN role can access the verification panel.</p>
      </div>
    </div>
  );
};

// This page aggregates sales from appointments as "sales" source data.
// It provides filters and multiple breakdowns. Export is client-side CSV for now.

type PaymentMethod =
  | "Cash"
  | "GCash"
  | "Maya"
  | "Bank Transfer"
  | "Unknown";

interface SalesRecord {
  id: string;
  date: string; // ISO date
  time?: string; // HH:mm
  branch: string;
  barber: string;
  services: string; // comma-separated
  gross: number;
  discount: number;
  net: number;
  paymentMethod: PaymentMethod;
  status: "completed" | "cancelled" | "refunded" | "pending";
  isManual?: boolean;
  notes?: string;
  receiptUrl?: string;
  verificationStatus?: "pending" | "verified" | "rejected";
  appointmentType?: "walk-in" | "reservation";
}

const parsePriceFromServices = (services: string): number => {
  // Expect service titles; fallback to 0. Extend with real pricing if stored per item.
  // Currently services are stored as a string; without structured amounts we set example baselines.
  if (!services) return 0;
  // Heuristic: count services separated by comma and assume an average ticket of 500 per service
  const count = services.split(",").filter(Boolean).length || 1;
  return count * 500;
};

const toCsv = (rows: any[]) => {
  if (!rows.length) return "";

  // Helper function to properly escape CSV values
  const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = Object.keys(rows[0]);
  const headerRow = headers.map(escapeCsvValue).join(",");
  const bodyRows = rows.map((r) =>
    headers.map((h) => escapeCsvValue(r[h])).join(",")
  );

  return [headerRow, ...bodyRows].join("\n");
};

const SalesManagementPage = () => {
  // Admin role checking with stable state
  const { isAdmin, isLoading: adminLoading } = useAdminRole();

  // Admin-only role checking for verification tab
  const { isAdminOnly, isLoading: adminOnlyLoading } = useAdminOnlyRole();

  // Stable admin state to prevent UI flickering during session refresh
  const [stableIsAdmin, setStableIsAdmin] = useState(false);
  const [stableIsAdminOnly, setStableIsAdminOnly] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Update stable admin status only when we have a definitive role (not during loading)
  useEffect(() => {
    if (!adminLoading && isAdmin !== undefined) {
      setStableIsAdmin(isAdmin);
      setHasInitialized(true);
      console.log("Stable admin status updated:", isAdmin);
    }
  }, [isAdmin, adminLoading]);

  // Update stable admin-only status
  useEffect(() => {
    if (!adminOnlyLoading && isAdminOnly !== undefined) {
      setStableIsAdminOnly(isAdminOnly);
      console.log("Stable admin-only status updated:", isAdminOnly);
    }
  }, [isAdminOnly, adminOnlyLoading]);

  // Use stable admin status
  const effectiveIsAdmin = hasInitialized ? stableIsAdmin : isAdmin;
  const effectiveIsAdminOnly = hasInitialized ? stableIsAdminOnly : isAdminOnly;

  // Debug logging
  useEffect(() => {
    console.log('Admin state:', {
      isAdmin,
      adminLoading,
      stableIsAdmin,
      effectiveIsAdmin,
      hasInitialized,
      isAdminOnly,
      adminOnlyLoading,
      stableIsAdminOnly,
      effectiveIsAdminOnly
    });
  }, [isAdmin, adminLoading, stableIsAdmin, effectiveIsAdmin, hasInitialized, isAdminOnly, adminOnlyLoading, stableIsAdminOnly, effectiveIsAdminOnly]);

  // Session for user data
  const { data: session } = useSession();

  const [rangeType, setRangeType] = useState<
    "daily" | "weekly" | "monthly" | "custom"
  >("daily");
  const [startDate, setStartDate] = useState<string>(
    dayjs().subtract(7, 'days').format("YYYY-MM-DD"),
  );
  const [endDate, setEndDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [barberFilter, setBarberFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");

  // Daily report states
  const [dailyReportDate, setDailyReportDate] = useState<string>(
    dayjs().format("YYYY-MM-DD"),
  );
  const [dailyReportBranch, setDailyReportBranch] = useState<string>("ALL");
  const [preparedBy, setPreparedBy] = useState<string>("");
  const [dailyNotes, setDailyNotes] = useState<string>("");

  // Auto-populate preparedBy with logged-in user's name
  useEffect(() => {
    if (session?.user?.name) {
      setPreparedBy(session.user.name);
    } else if (session?.user?.email) {
      setPreparedBy(session.user.email);
    }
  }, [session]);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [selectedBranchForBarbers, setSelectedBranchForBarbers] =
    useState<string>("ALL");
  const [servicesCatalog, setServicesCatalog] = useState<any[]>([]);
  const [manualSales, setManualSales] = useState<SalesRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination state for different tables
  const [branchPage, setBranchPage] = useState(1);
  const [branchItemsPerPage, setBranchItemsPerPage] = useState(10);
  const [barberPage, setBarberPage] = useState(1);
  const [barberItemsPerPage, setBarberItemsPerPage] = useState(10);
  const [servicePage, setServicePage] = useState(1);
  const [serviceItemsPerPage, setServiceItemsPerPage] = useState(10);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentItemsPerPage, setPaymentItemsPerPage] = useState(10);
  const [dailySalesPage, setDailySalesPage] = useState(1);
  const [dailySalesItemsPerPage, setDailySalesItemsPerPage] = useState(10);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsItemsPerPage, setTransactionsItemsPerPage] = useState(10);

  // Load persisted manual transactions from backend
  const loadManual = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      }

      const res = await fetch("/api/admin/sales", { cache: "no-store" });
      if (!res.ok) return;
      const rows = await res.json();
      const normalized = (Array.isArray(rows) ? rows : []).map((r: any) => ({
        ...r,
        gross: typeof r.gross === "string" ? parseFloat(r.gross) : r.gross,
        discount:
          typeof r.discount === "string"
            ? parseFloat(r.discount)
            : r.discount,
        net: typeof r.net === "string" ? parseFloat(r.net) : r.net,
        isManual: true,
      }));
      setManualSales(normalized);
    } catch (e) {
      // ignore
    } finally {
      if (showRefreshIndicator) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadManual();
  }, [loadManual]);

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        const [branchesRes, barbersRes, appointmentsRes, servicesRes] =
          await Promise.all([
            fetch("/api/branches/unified").then((r) => r.json()),
            fetch("/api/barbers").then((r) => r.json()),
            fetch("/api/admin/appointments").then((r) => r.json()),
            fetch("/api/services").then((r) => r.json()),
          ]);

        setAppointments(Array.isArray(appointmentsRes) ? appointmentsRes : []);
        setBranches(branchesRes || []);
        setBarbers(barbersRes || []);
        setServicesCatalog(servicesRes || []);
      } catch (e) {
        setAppointments([]);
      }
    };
    load();
  }, []);

  const branchesList = useMemo(
    () => [...new Set((branches || []).map((b: any) => b.name))],
    [branches],
  );
  const branchOptions = useMemo(
    () =>
      (branches || []).map((b: any) => ({
        id: b.id || b.originalId || b.name,
        name: b.name,
      })),
    [branches],
  );
  const branchNameById = (id: string) =>
    branchOptions.find((b) => b.id === id)?.name || id;

  // Filter barbers by selected branch in the daily report form
  const barbersForBranch = useMemo(() => {
    if (!barbers || barbers.length === 0) return [];
    if (!selectedBranchForBarbers || selectedBranchForBarbers === "ALL")
      return barbers.map((b: any) => b.name);
    // selectedBranchForBarbers is currently a branch NAME. Match against barber.branches which contain IDs.
    // So convert branch name to ID using branchOptions if available.
    const branchId =
      branchOptions.find((bo) => bo.name === selectedBranchForBarbers)?.id ||
      selectedBranchForBarbers;
    return barbers
      .filter((b: any) => (b.branches || []).includes(branchId))
      .map((b: any) => b.name);
  }, [barbers, selectedBranchForBarbers, branchOptions]);

  // Price helpers from services catalog
  const servicePriceMap = useMemo(() => {
    const map: Record<string, number> = {};
    (servicesCatalog || []).forEach((s: any) => {
      const priceNum =
        typeof s.price === "number" ? s.price : parseFloat(String(s.price));
      if (!isNaN(priceNum)) {
        map[(s.title || "").toLowerCase()] = priceNum;
      }
    });
    return map;
  }, [servicesCatalog]);

  const computeGrossFromTitles = (titles: string[]): number => {
    if (!titles || titles.length === 0) return 0;
    let sum = 0;
    titles.forEach((t) => {
      const key = (t || "").toLowerCase();
      const price = servicePriceMap[key];
      if (typeof price === "number" && !isNaN(price)) {
        sum += price;
      }
    });
    return sum;
  };

  // Helper function to check if transaction should be included in revenue
  const shouldIncludeInRevenue = (record: SalesRecord): boolean => {
    // Cash transactions are always included
    if (record.paymentMethod === "Cash") return true;

    // Digital payment methods need verification
    const verifiablePaymentMethods = ["GCash", "Maya", "Bank Transfer"];
    if (verifiablePaymentMethods.includes(record.paymentMethod)) {
      // Only include if verified (verificationStatus === "verified")
      // If no verification status, it's pending, so exclude it
      return (record as any).verificationStatus === "verified";
    }

    // Other payment methods (Card, Unknown) are included by default
    return true;
  };

  // Build sales records from appointments
  const sales: SalesRecord[] = useMemo(() => {
    const normPayment = (raw: string | undefined): PaymentMethod => {
      const val = (raw || "").toLowerCase();
      if (val.includes("cash")) return "Cash";
      if (val.includes("gcash")) return "GCash";
      if (val.includes("maya")) return "Maya";
      if (val.includes("bank")) return "Bank Transfer";
      return "Unknown";
    };

    const fromAppointments: SalesRecord[] = (appointments || []).map((a) => {
      const titles = (a.services || "")
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);
      const catalogGross = computeGrossFromTitles(titles);
      const gross =
        catalogGross > 0 ? catalogGross : parsePriceFromServices(a.services);
      const discount = 0; // no discount data available
      const net = Math.max(0, gross - discount);
      return {
        id: a.id,
        date: a.appointmentDate || a.createdAt,
        time: a.appointmentTime,
        branch: a.branch,
        barber: a.barber || "No Preference",
        services: a.services,
        gross,
        discount,
        net,
        paymentMethod: normPayment(a.paymentMethod),
        status:
          new Date(`${a.appointmentDate}T${a.appointmentTime}`) < new Date()
            ? "completed"
            : "pending",
        appointmentType: "reservation" as const, // Appointments are considered reservations
      } as SalesRecord;
    });
    return [...fromAppointments, ...manualSales];
  }, [appointments, manualSales]);

  // Track if the user has manually changed the range type to prevent auto-adjustment
  const [hasUserChangedRange, setHasUserChangedRange] = useState(false);

  // Helper function to handle range type changes
  const handleRangeTypeChange = (v: string) => {
    setRangeType(v as "daily" | "weekly" | "monthly" | "custom");
    setHasUserChangedRange(true);
  };

  // Adjust date range when rangeType changes (only if user manually changed it)
  useEffect(() => {
    // Only adjust dates if the user manually changed the range type
    if (!hasUserChangedRange) {
      return;
    }

    const now = dayjs();
    if (rangeType === "daily") {
      setStartDate(now.format("YYYY-MM-DD"));
      setEndDate(now.format("YYYY-MM-DD"));
    } else if (rangeType === "weekly") {
      setStartDate(now.startOf("week").format("YYYY-MM-DD"));
      setEndDate(now.endOf("week").format("YYYY-MM-DD"));
    } else if (rangeType === "monthly") {
      setStartDate(now.startOf("month").format("YYYY-MM-DD"));
      setEndDate(now.endOf("month").format("YYYY-MM-DD"));
    }
  }, [rangeType, hasUserChangedRange]);

  const filtered = useMemo(() => {
    const start = dayjs(startDate).startOf("day");
    const end = dayjs(endDate).endOf("day");
    return sales.filter((s) => {
      const d = dayjs(s.date);
      const inRange =
        d.isAfter(start.subtract(1, "millisecond")) &&
        d.isBefore(end.add(1, "millisecond"));
      const byBranch = branchFilter ? s.branch === branchFilter : true;
      const byBarber = barberFilter ? s.barber === barberFilter : true;
      const byPayment = paymentFilter
        ? s.paymentMethod === paymentFilter
        : true;
      const includeInRevenue = shouldIncludeInRevenue(s);
      return inRange && byBranch && byBarber && byPayment && includeInRevenue;
    });
  }, [sales, startDate, endDate, branchFilter, barberFilter, paymentFilter]);

  const totals = useMemo(() => {
    const gross = filtered.reduce((sum, r) => sum + r.gross, 0);
    const discount = filtered.reduce((sum, r) => sum + r.discount, 0);
    const net = filtered.reduce((sum, r) => sum + r.net, 0);
    return { gross, discount, net };
  }, [filtered]);

  const exportCsv = () => {
    if (!filtered.length) {
      toast.error("No data to export");
      return;
    }

    // Format the data for CSV export with proper column names
    const csvData = filtered.map((record) => ({
      "Transaction ID": record.id,
      "Date": dayjs(record.date).format("YYYY-MM-DD"),
      "Time": record.time || "",
      "Branch": record.branch,
      "Barber": record.barber,
      "Type": record.appointmentType === "walk-in" ? "Walk-in" : "Reservation",
      "Services": record.services,
      "Gross Amount": record.gross,
      "Discount": record.discount,
      "Net Amount": record.net,
      "Payment Method": record.paymentMethod,
      "Status": record.status,
      "Source": record.isManual ? "Manual" : "Appointment",
      "Notes": record.notes || ""
    }));

    const csv = toCsv(csvData);
    // Add BOM for proper UTF-8 encoding in Excel
    const csvWithBom = '\uFEFF' + csv;
    const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} records to CSV`);
  };

  // Simple visual summaries using tables and badges (charts can be added later)

  const barbersList = useMemo(
    () => [...new Set((barbers || []).map((b: any) => b.name))],
    [barbers],
  );

  const branchBreakdown = useMemo(() => {
    const grouped: Record<
      string,
      {
        revenue: number;
        transactions: number;
        topService: string;
        peakHour: string;
      }
    > = {};
    const serviceCountsByBranch: Record<string, Record<string, number>> = {};
    const hourCountsByBranch: Record<string, Record<string, number>> = {};

    filtered.forEach((r) => {
      grouped[r.branch] ??= {
        revenue: 0,
        transactions: 0,
        topService: "-",
        peakHour: "-",
      };
      serviceCountsByBranch[r.branch] ??= {};
      hourCountsByBranch[r.branch] ??= {};

      grouped[r.branch].revenue += r.net;
      grouped[r.branch].transactions += 1;

      // services
      (r.services || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((svc) => {
          serviceCountsByBranch[r.branch][svc] =
            (serviceCountsByBranch[r.branch][svc] || 0) + 1;
        });
      // hour
      const hour = (r.time || "").slice(0, 2);
      if (hour) {
        hourCountsByBranch[r.branch][hour] =
          (hourCountsByBranch[r.branch][hour] || 0) + 1;
      }
    });

    Object.keys(grouped).forEach((branch) => {
      const svcCounts = serviceCountsByBranch[branch] || {};
      const topSvc =
        Object.entries(svcCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
      grouped[branch].topService = topSvc;

      const hourCounts = hourCountsByBranch[branch] || {};
      const topHour =
        Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
      grouped[branch].peakHour = topHour === "-" ? "-" : `${topHour}:00`;
    });

    return grouped;
  }, [filtered]);

  // Paginated branch breakdown
  const paginatedBranchBreakdown = useMemo(() => {
    const entries = Object.entries(branchBreakdown);
    const startIndex = (branchPage - 1) * branchItemsPerPage;
    const endIndex = startIndex + branchItemsPerPage;
    return entries.slice(startIndex, endIndex);
  }, [branchBreakdown, branchPage, branchItemsPerPage]);

  const branchTotalPages = Math.ceil(Object.keys(branchBreakdown).length / branchItemsPerPage);

  const barberBreakdown = useMemo(() => {
    const grouped: Record<string, { revenue: number; clients: number }> = {};
    filtered.forEach((r) => {
      grouped[r.barber] ??= { revenue: 0, clients: 0 };
      grouped[r.barber].revenue += r.net;
      grouped[r.barber].clients += 1;
    });
    return grouped;
  }, [filtered]);

  // Paginated barber breakdown
  const paginatedBarberBreakdown = useMemo(() => {
    const entries = Object.entries(barberBreakdown);
    const startIndex = (barberPage - 1) * barberItemsPerPage;
    const endIndex = startIndex + barberItemsPerPage;
    return entries.slice(startIndex, endIndex);
  }, [barberBreakdown, barberPage, barberItemsPerPage]);

  const barberTotalPages = Math.ceil(Object.keys(barberBreakdown).length / barberItemsPerPage);

  const serviceBreakdown = useMemo(() => {
    const grouped: Record<string, number> = {};
    filtered.forEach((r) => {
      (r.services || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((svc) => {
          grouped[svc] =
            (grouped[svc] || 0) +
            Math.max(
              1,
              Math.round(
                r.net /
                ((r.services || "").split(",").filter(Boolean).length || 1),
              ),
            );
        });
    });
    return grouped;
  }, [filtered]);

  // Paginated service breakdown
  const paginatedServiceBreakdown = useMemo(() => {
    const entries = Object.entries(serviceBreakdown);
    const startIndex = (servicePage - 1) * serviceItemsPerPage;
    const endIndex = startIndex + serviceItemsPerPage;
    return entries.slice(startIndex, endIndex);
  }, [serviceBreakdown, servicePage, serviceItemsPerPage]);

  const serviceTotalPages = Math.ceil(Object.keys(serviceBreakdown).length / serviceItemsPerPage);

  const paymentBreakdown = useMemo(() => {
    const grouped: Record<string, number> = {};
    filtered.forEach((r) => {
      grouped[r.paymentMethod] = (grouped[r.paymentMethod] || 0) + r.net;
    });
    return grouped;
  }, [filtered]);

  // Paginated payment breakdown
  const paginatedPaymentBreakdown = useMemo(() => {
    const entries = Object.entries(paymentBreakdown);
    const startIndex = (paymentPage - 1) * paymentItemsPerPage;
    const endIndex = startIndex + paymentItemsPerPage;
    return entries.slice(startIndex, endIndex);
  }, [paymentBreakdown, paymentPage, paymentItemsPerPage]);

  const paymentTotalPages = Math.ceil(Object.keys(paymentBreakdown).length / paymentItemsPerPage);

  // Daily report calculations
  const daySales = useMemo(() => {
    return sales.filter((s) => {
      const isSameDay = dayjs(s.date).isSame(dayjs(dailyReportDate), "day");
      const byBranch =
        dailyReportBranch === "ALL"
          ? true
          : s.branch === branchNameById(dailyReportBranch);
      const includeInRevenue = shouldIncludeInRevenue(s);
      return isSameDay && byBranch && includeInRevenue;
    });
  }, [sales, dailyReportDate, dailyReportBranch, branchOptions]);

  // Paginated daily sales
  const paginatedDaySales = useMemo(() => {
    const startIndex = (dailySalesPage - 1) * dailySalesItemsPerPage;
    const endIndex = startIndex + dailySalesItemsPerPage;
    return daySales.slice(startIndex, endIndex);
  }, [daySales, dailySalesPage, dailySalesItemsPerPage]);

  const dailySalesTotalPages = Math.ceil(daySales.length / dailySalesItemsPerPage);

  // Paginated main transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (transactionsPage - 1) * transactionsItemsPerPage;
    const endIndex = startIndex + transactionsItemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, transactionsPage, transactionsItemsPerPage]);

  const transactionsTotalPages = Math.ceil(filtered.length / transactionsItemsPerPage);

  // Pagination controls component
  const PaginationControls = ({
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    onPageChange,
    onItemsPerPageChange,
    itemName = "items"
  }: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (items: number) => void;
    itemName?: string;
  }) => {
    if (totalPages <= 1) return null;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-700">
            Showing {startIndex + 1} to {endIndex} of {totalItems} {itemName}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Label className="text-sm">Rows per page:</Label>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                onItemsPerPageChange(Number(value));
                onPageChange(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm px-2">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const dayTotals = useMemo(() => {
    const gross = daySales.reduce((sum, r) => sum + r.gross, 0);
    const discount = daySales.reduce((sum, r) => sum + r.discount, 0);
    const net = daySales.reduce((sum, r) => sum + r.net, 0);
    const transactions = daySales.length;
    return { gross, discount, net, transactions };
  }, [daySales]);

  const dayPayments = useMemo(() => {
    const grouped: Record<string, number> = {};
    daySales.forEach((r) => {
      grouped[r.paymentMethod] = (grouped[r.paymentMethod] || 0) + r.net;
    });
    return grouped;
  }, [daySales]);

  const exportDailyCsv = () => {
    if (!daySales.length) {
      toast.error("No data to export for this date");
      return;
    }

    // Create a comprehensive daily report CSV with proper structure
    const csvData = daySales.map((record) => ({
      "Report Date": dailyReportDate,
      "Branch": dailyReportBranch === "ALL" ? "ALL" : branchNameById(dailyReportBranch),
      "Prepared By": preparedBy || "",
      "Transaction ID": record.id,
      "Date": dayjs(record.date).format("YYYY-MM-DD"),
      "Time": record.time || "",
      "Barber": record.barber,
      "Type": record.appointmentType === "walk-in" ? "Walk-in" : "Reservation",
      "Services": record.services,
      "Gross Amount": record.gross,
      "Discount": record.discount,
      "Net Amount": record.net,
      "Payment Method": record.paymentMethod,
      "Status": record.status,
      "Source": record.isManual ? "Manual" : "Appointment",
      "Notes": record.notes || "",
      "Report Notes": dailyNotes || ""
    }));

    const csv = toCsv(csvData);
    // Add BOM for proper UTF-8 encoding in Excel
    const csvWithBom = '\uFEFF' + csv;
    const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const brName =
      dailyReportBranch === "ALL" ? "ALL" : branchNameById(dailyReportBranch);
    a.download = `daily-report-${dailyReportDate}-${brName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Daily report exported with ${daySales.length} transactions`);
  };

  const printDaily = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const paymentsHtml = Object.entries(dayPayments)
      .map(
        ([m, amt]) =>
          `<tr><td style="padding:4px 8px;border:1px solid #ddd;">${m}</td><td style="padding:4px 8px;border:1px solid #ddd;">₱${(amt as number).toLocaleString()}</td></tr>`,
      )
      .join("");
    const txRows = daySales
      .map(
        (r) =>
          `<tr><td style="padding:4px 8px;border:1px solid #ddd;">${dayjs(r.date).format("MMM DD, YYYY")} ${r.time || ""}</td><td style="padding:4px 8px;border:1px solid #ddd;">${r.branch}</td><td style="padding:4px 8px;border:1px solid #ddd;">${r.barber}</td><td style="padding:4px 8px;border:1px solid #ddd;">${r.services}</td><td style=\"padding:4px 8px;border:1px solid #ddd;\">₱${r.net.toLocaleString()}</td></tr>`,
      )
      .join("");
    w.document.write(`
      <html><head><title>Daily Sales Report</title></head><body>
      <h2>Daily Sales Report</h2>
      <p><strong>Date:</strong> ${dailyReportDate}</p>
      <p><strong>Branch:</strong> ${dailyReportBranch === "ALL" ? "ALL" : branchNameById(dailyReportBranch)}</p>
      <p><strong>Prepared by:</strong> ${preparedBy || "-"}</p>
      <p><strong>Notes:</strong> ${dailyNotes || "-"}</p>
      <h3>Summary</h3>
      <ul>
        <li>Transactions: ${dayTotals.transactions}</li>
        <li>Gross: ₱${dayTotals.gross.toLocaleString()}</li>
        <li>Discount: ₱${dayTotals.discount.toLocaleString()}</li>
        <li>Net: ₱${dayTotals.net.toLocaleString()}</li>
      </ul>
      <h3>Payments</h3>
      <table style="border-collapse:collapse;min-width:300px;margin-bottom:12px;">
        <thead><tr><th style="padding:6px 8px;border:1px solid #ddd;">Method</th><th style="padding:6px 8px;border:1px solid #ddd;">Amount</th></tr></thead>
        <tbody>${paymentsHtml}</tbody>
      </table>
      <h3>Transactions</h3>
      <table style="border-collapse:collapse;width:100%;">
        <thead>
          <tr>
            <th style="padding:6px 8px;border:1px solid #ddd;">Date/Time</th>
            <th style="padding:6px 8px;border:1px solid #ddd;">Branch</th>
            <th style="padding:6px 8px;border:1px solid #ddd;">Barber</th>
            <th style="padding:6px 8px;border:1px solid #ddd;">Services</th>
            <th style="padding:6px 8px;border:1px solid #ddd;">Net</th>
          </tr>
        </thead>
        <tbody>${txRows}</tbody>
      </table>
      </body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  // Manual transaction form state
  const [txDate, setTxDate] = useState<string>(dailyReportDate);
  const [txTime, setTxTime] = useState<string>("10:00");
  const [txBranch, setTxBranch] = useState<string>("ALL");

  // Synchronize branch selection between daily report and manual transaction
  useEffect(() => {
    setTxBranch(dailyReportBranch);
  }, [dailyReportBranch]);

  // Custom setter for dailyReportBranch that also updates txBranch
  const handleDailyReportBranchChange = (branch: string) => {
    setDailyReportBranch(branch);
    setTxBranch(branch);
  };

  // Custom setter for txBranch that also updates dailyReportBranch
  const handleTxBranchChange = (branch: string) => {
    setTxBranch(branch);
    setDailyReportBranch(branch);
  };
  const [txBarber, setTxBarber] = useState<string>("");
  const [txAppointmentType, setTxAppointmentType] = useState<string>("walk-in");
  const [txServices, setTxServices] = useState<string>("");
  const [txServicesSelected, setTxServicesSelected] = useState<string[]>([]);
  const txComputedGross = useMemo(
    () => computeGrossFromTitles(txServicesSelected),
    [txServicesSelected, servicesCatalog],
  );
  useEffect(() => {
    setTxGross(String(txComputedGross));
  }, [txComputedGross]);
  const [txGross, setTxGross] = useState<string>("0");
  const [txDiscount, setTxDiscount] = useState<string>("0");
  const [txPayment, setTxPayment] = useState<PaymentMethod>("Cash");

  const [txNotes, setTxNotes] = useState<string>("");
  const [txGcashReceipt, setTxGcashReceipt] = useState<File | null>(null);

  const addManualTransaction = async () => {
    if (!txDate || !txTime) {
      toast.error("Date and time are required");
      return;
    }
    if (!txBranch || txBranch === "ALL") {
      toast.error("Please select a branch");
      return;
    }
    const gross = txComputedGross;
    const discount = Number(txDiscount) || 0;
    if (gross < 0 || discount < 0) {
      toast.error("Amounts cannot be negative");
      return;
    }

    // Validate digital payment receipt upload
    if ((txPayment === "GCash" || txPayment === "Maya" || txPayment === "Bank Transfer") && !txGcashReceipt) {
      toast.error(`Please upload a ${txPayment} receipt image`);
      return;
    }

    const net = Math.max(0, gross - discount);

    try {
      let receiptUrl = "";

      // Upload file if digital payment method
      if ((txPayment === "GCash" || txPayment === "Maya" || txPayment === "Bank Transfer") && txGcashReceipt) {
        console.log(`Uploading ${txPayment} receipt:`, txGcashReceipt.name);
        const formData = new FormData();
        formData.append("file", txGcashReceipt);
        formData.append("type", `${txPayment.toLowerCase().replace(' ', '-')}-receipt`);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorText = await uploadRes.text();
          console.error("Upload failed:", errorText);
          toast.error("Failed to upload receipt image");
          return;
        }

        const uploadResult = await uploadRes.json();
        console.log("Upload successful:", uploadResult);
        receiptUrl = uploadResult.url;
      }

      const payload = {
        date: txDate,
        time: txTime,
        branch: txBranch,
        barber: txBarber || `${txAppointmentType === "walk-in" ? "Walk-in" : "Reservation"}`,
        services: txServicesSelected.join(", "),
        gross,
        discount,
        net,
        paymentMethod: txPayment,
        status: "completed",
        isManual: true,
        notes: txNotes,
        receiptUrl: receiptUrl || null,
        appointmentType: txAppointmentType as "walk-in" | "reservation",
      };

      console.log("Saving transaction with payload:", payload);
      const res = await fetch("/api/admin/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Sales API error:", errorText);
        throw new Error("Failed to save");
      }
      const saved = await res.json();
      const normalized = {
        ...saved,
        gross:
          typeof saved.gross === "string"
            ? parseFloat(saved.gross)
            : saved.gross,
        discount:
          typeof saved.discount === "string"
            ? parseFloat(saved.discount)
            : saved.discount,
        net: typeof saved.net === "string" ? parseFloat(saved.net) : saved.net,
        isManual: true,
      } as SalesRecord;
      setManualSales((prev) => [normalized, ...prev]);
      toast.success("Manual transaction added");
    } catch (e) {
      console.error("Transaction error:", e);
      toast.error("Failed to save transaction");
      return;
    }
    // reset some fields
    setTxServices("");
    setTxServicesSelected([]);
    setTxGross("0");
    setTxDiscount("0");
    setTxNotes("");
    setTxGcashReceipt(null);
    setTxAppointmentType("walk-in");
  };

  const removeManualTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/sales?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) throw new Error("Failed");
      setManualSales((prev) => prev.filter((r) => r.id !== id));
      toast.success("Removed");
    } catch (e) {
      toast.error("Failed to remove");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Management</h1>
        <p className="text-gray-600">Track sales, generate reports, and analyze performance across all branches</p>
      </div>

      <BranchManagerInfo />



      {/* Breakdowns */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="daily-report" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Daily Report
          </TabsTrigger>
          <TabsTrigger value="branches" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Branches
          </TabsTrigger>
          <TabsTrigger value="barbers" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Barbers
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Verification
            {adminLoading && <span className="ml-1 text-xs">...</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters & Date Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Select
                  value={rangeType}
                  onValueChange={handleRangeTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <Select
                  value={branchFilter}
                  onValueChange={(v) => setBranchFilter(v === "ALL" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Branches</SelectItem>
                    {branchesList.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={barberFilter}
                  onValueChange={(v) => setBarberFilter(v === "ALL" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Barbers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Barbers</SelectItem>
                    {barbersList.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={exportCsv}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Gross</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱{totals.gross.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {filtered.length} transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱{totals.discount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Applied discounts
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Net</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isRefreshing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                      Updating...
                    </div>
                  ) : (
                    `₱${totals.net.toLocaleString()}`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Final revenue
                </p>
              </CardContent>
            </Card>
          </div>


        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters & Date Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Select
                  value={rangeType}
                  onValueChange={handleRangeTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <Select
                  value={branchFilter}
                  onValueChange={(v) => setBranchFilter(v === "ALL" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Branches</SelectItem>
                    {branchesList.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={barberFilter}
                  onValueChange={(v) => setBarberFilter(v === "ALL" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Barbers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Barbers</SelectItem>
                    {barbersList.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={exportCsv}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <SalesAnalyticsDashboard
            sales={sales}
            filtered={filtered}
            totals={totals}
            startDate={startDate}
            endDate={endDate}
          />
        </TabsContent>

        <TabsContent value="branches" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters & Date Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Select
                  value={rangeType}
                  onValueChange={handleRangeTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <Select
                  value={branchFilter}
                  onValueChange={(v) => setBranchFilter(v === "ALL" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Branches</SelectItem>
                    {branchesList.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={barberFilter}
                  onValueChange={(v) => setBarberFilter(v === "ALL" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Barbers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Barbers</SelectItem>
                    {barbersList.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={exportCsv}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branch Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Revenue (Net)</TableHead>
                    <TableHead>Top Service</TableHead>
                    <TableHead>Peak Hour</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBranchBreakdown.map(([branch, v]) => (
                    <TableRow key={branch}>
                      <TableCell>{branch}</TableCell>
                      <TableCell>{(v as any).transactions}</TableCell>
                      <TableCell>
                        ₱{(v as any).revenue.toLocaleString()}
                      </TableCell>
                      <TableCell>{(v as any).topService}</TableCell>
                      <TableCell>{(v as any).peakHour}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <PaginationControls
                currentPage={branchPage}
                totalPages={branchTotalPages}
                itemsPerPage={branchItemsPerPage}
                totalItems={Object.keys(branchBreakdown).length}
                onPageChange={setBranchPage}
                onItemsPerPageChange={setBranchItemsPerPage}
                itemName="branches"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="barbers" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters & Date Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Select
                  value={rangeType}
                  onValueChange={handleRangeTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <Select
                  value={branchFilter}
                  onValueChange={(v) => setBranchFilter(v === "ALL" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Branches</SelectItem>
                    {branchesList.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={barberFilter}
                  onValueChange={(v) => setBarberFilter(v === "ALL" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Barbers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Barbers</SelectItem>
                    {barbersList.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={exportCsv}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Barber Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Barber</TableHead>
                    <TableHead>Clients</TableHead>
                    <TableHead>Revenue (Net)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBarberBreakdown.map(([barber, v]) => (
                    <TableRow key={barber}>
                      <TableCell>{barber}</TableCell>
                      <TableCell>{v.clients}</TableCell>
                      <TableCell>₱{v.revenue.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <PaginationControls
                currentPage={barberPage}
                totalPages={barberTotalPages}
                itemsPerPage={barberItemsPerPage}
                totalItems={Object.keys(barberBreakdown).length}
                onPageChange={setBarberPage}
                onItemsPerPageChange={setBarberItemsPerPage}
                itemName="barbers"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters & Date Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Select
                  value={rangeType}
                  onValueChange={handleRangeTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <Select
                  value={branchFilter}
                  onValueChange={(v) => setBranchFilter(v === "ALL" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Branches</SelectItem>
                    {branchesList.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={barberFilter}
                  onValueChange={(v) => setBarberFilter(v === "ALL" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Barbers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Barbers</SelectItem>
                    {barbersList.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={exportCsv}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service-Based Reporting</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Estimated Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedServiceBreakdown.map(
                    ([service, revenue]) => (
                      <TableRow key={service}>
                        <TableCell>{service}</TableCell>
                        <TableCell>
                          ₱{(revenue as number).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>

              <PaginationControls
                currentPage={servicePage}
                totalPages={serviceTotalPages}
                itemsPerPage={serviceItemsPerPage}
                totalItems={Object.keys(serviceBreakdown).length}
                onPageChange={setServicePage}
                onItemsPerPageChange={setServiceItemsPerPage}
                itemName="services"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters & Date Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Select
                  value={rangeType}
                  onValueChange={handleRangeTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <Select
                  value={branchFilter}
                  onValueChange={(v) => setBranchFilter(v === "ALL" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Branches</SelectItem>
                    {branchesList.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={barberFilter}
                  onValueChange={(v) => setBarberFilter(v === "ALL" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Barbers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Barbers</SelectItem>
                    {barbersList.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={exportCsv}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Revenue (Net)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPaymentBreakdown.map(([method, revenue]) => (
                    <TableRow key={method}>
                      <TableCell>{method}</TableCell>
                      <TableCell>
                        ₱{(revenue as number).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <PaginationControls
                currentPage={paymentPage}
                totalPages={paymentTotalPages}
                itemsPerPage={paymentItemsPerPage}
                totalItems={Object.keys(paymentBreakdown).length}
                onPageChange={setPaymentPage}
                onItemsPerPageChange={setPaymentItemsPerPage}
                itemName="payment methods"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily-report" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters & Date Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Select
                  value={rangeType}
                  onValueChange={handleRangeTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <Select
                  value={branchFilter}
                  onValueChange={(v) => setBranchFilter(v === "ALL" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Branches</SelectItem>
                    {branchesList.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={barberFilter}
                  onValueChange={(v) => setBarberFilter(v === "ALL" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Barbers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Barbers</SelectItem>
                    {barbersList.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={exportCsv}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create Daily Sales Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="mb-1 block">Report Date</Label>
                  <Input
                    type="date"
                    value={dailyReportDate}
                    onChange={(e) => setDailyReportDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-1 block">Prepared By</Label>
                  <Input
                    value={preparedBy}
                    readOnly
                    placeholder="Auto-filled from logged-in user"
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>

              </div>
              <div>
                <Label className="mb-1 block">Notes</Label>
                <Textarea
                  value={dailyNotes}
                  onChange={(e) => setDailyNotes(e.target.value)}
                  placeholder="Optional notes for this report"
                  rows={3}
                />
              </div>

              {/* Manual Transaction Form */}
              <div className="border rounded-lg p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Add Manual Transaction</h3>

                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700 border-b pb-2">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="mb-2 block text-sm font-medium">Date *</Label>
                      <Input
                        type="date"
                        value={txDate}
                        onChange={(e) => setTxDate(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block text-sm font-medium">Time *</Label>
                      <Input
                        type="time"
                        value={txTime}
                        onChange={(e) => setTxTime(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block text-sm font-medium">Branch *</Label>
                      <Select
                        value={txBranch}
                        onValueChange={(v) => {
                          handleTxBranchChange(v);
                          setSelectedBranchForBarbers(v);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Select Branch</SelectItem>
                          {branchesList.map((b) => (
                            <SelectItem key={b} value={b}>
                              {b}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="mb-2 block text-sm font-medium">Type *</Label>
                      <Select
                        value={txAppointmentType}
                        onValueChange={(v) => setTxAppointmentType(v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="walk-in">Walk-in</SelectItem>
                          <SelectItem value="reservation">Reservation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block text-sm font-medium">Barber</Label>
                      <Select
                        value={txBarber}
                        onValueChange={(v) => setTxBarber(v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Barber (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {barbersForBranch.map((b) => (
                            <SelectItem key={b} value={b}>
                              {b}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Services Selection */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700 border-b pb-2">Services & Pricing</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <Label className="mb-2 block text-sm font-medium">Services *</Label>
                      <div className="border rounded-md p-3 max-h-64 overflow-auto bg-gray-50">
                        {servicesCatalog.map((s: any) => {
                          const checked = txServicesSelected.includes(s.title);
                          return (
                            <label
                              key={s.id || s.title}
                              className="flex items-center gap-3 py-2 px-2 hover:bg-white rounded cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                className="accent-blue-600 h-4 w-4"
                                checked={checked}
                                onChange={(e) => {
                                  setTxServicesSelected((prev) => {
                                    if (e.target.checked)
                                      return [...prev, s.title];
                                    return prev.filter((t) => t !== s.title);
                                  });
                                }}
                              />
                              <span className="flex-1 text-sm font-medium">{s.title}</span>
                              <span className="text-sm text-green-600 font-semibold">
                                ₱{(parseFloat(s.price) || s.price).toLocaleString()}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {txServicesSelected.length > 0 && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          <span className="font-medium text-blue-800">Selected:</span>
                          <div className="text-blue-700 mt-1">{txServicesSelected.join(", ")}</div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block text-sm font-medium">Gross Amount</Label>
                          <Input
                            type="number"
                            min="0"
                            value={txGross}
                            readOnly
                            className="bg-gray-100 font-semibold text-green-600"
                          />
                          <p className="text-xs text-gray-500 mt-1">Auto-calculated from services</p>
                        </div>
                        <div>
                          <Label className="mb-2 block text-sm font-medium">Discount</Label>
                          <Input
                            type="number"
                            min="0"
                            value={txDiscount}
                            onChange={(e) => setTxDiscount(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="mb-2 block text-sm font-medium">Net Amount</Label>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <span className="text-lg font-bold text-green-700">
                            ₱{Math.max(0, (parseFloat(txGross) || 0) - (parseFloat(txDiscount) || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700 border-b pb-2">Payment Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="mb-2 block text-sm font-medium">Payment Method *</Label>
                      <Select
                        value={txPayment}
                        onValueChange={(v) => setTxPayment(v as PaymentMethod)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Payment Method" />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            [
                              "Cash",
                              "GCash",
                              "Maya",
                              "Bank Transfer",
                            ] as PaymentMethod[]
                          ).map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {(txPayment === "GCash" || txPayment === "Maya" || txPayment === "Bank Transfer") && (
                      <div>
                        <Label className="mb-2 block text-sm font-medium">
                          {txPayment === "GCash" && "GCash Receipt *"}
                          {txPayment === "Maya" && "Maya Receipt *"}
                          {txPayment === "Bank Transfer" && "Bank Transfer Receipt *"}
                        </Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setTxGcashReceipt(file || null);
                          }}
                          className="cursor-pointer"
                        />
                        {txGcashReceipt && (
                          <div className="mt-2 p-2 bg-green-50 rounded">
                            <p className="text-sm text-green-700 font-medium">
                              ✓ Selected: {txGcashReceipt.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              Size: {(txGcashReceipt.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        )}
                        {!txGcashReceipt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Upload receipt image (max 5MB)
                          </p>
                        )}
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                          <p className="text-xs text-amber-700">
                            ⚠️ This transaction will require verification before being confirmed.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label className="mb-2 block text-sm font-medium">Notes</Label>
                  <Textarea
                    value={txNotes}
                    onChange={(e) => setTxNotes(e.target.value)}
                    placeholder="Optional notes about this transaction..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div>
                  <Label className="mb-1 block">Notes</Label>
                  <Textarea
                    value={txNotes}
                    onChange={(e) => setTxNotes(e.target.value)}
                    placeholder="Optional"
                    rows={2}
                  />
                </div>
                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTxServices("");
                      setTxGross("0");
                      setTxDiscount("0");
                      setTxNotes("");
                      setTxGcashReceipt(null);
                      setTxServicesSelected([]);
                    }}
                    className="px-6"
                  >
                    Clear Form
                  </Button>
                  <Button
                    onClick={addManualTransaction}
                    className="px-6 bg-blue-600 hover:bg-blue-700"
                  >
                    Add Transaction
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    {dayTotals.transactions}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Gross</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    ₱{dayTotals.gross.toLocaleString()}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Discount</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    ₱{dayTotals.discount.toLocaleString()}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Net</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    ₱{dayTotals.net.toLocaleString()}
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={printDaily}>
                  Print
                </Button>
                <Button onClick={exportDailyCsv}>Export CSV</Button>
              </div>

              <div className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Barber</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDaySales.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          {dayjs(r.date).format("MMM DD, YYYY")}
                        </TableCell>
                        <TableCell>{r.time}</TableCell>
                        <TableCell>{r.branch}</TableCell>
                        <TableCell>{r.barber}</TableCell>
                        <TableCell>
                          <Badge variant={r.appointmentType === "walk-in" ? "secondary" : "outline"}>
                            {r.appointmentType === "walk-in" ? "Walk-in" : "Reservation"}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className="max-w-[300px] truncate"
                          title={r.services}
                        >
                          {r.services}
                        </TableCell>
                        <TableCell>₱{r.gross.toLocaleString()}</TableCell>
                        <TableCell>₱{r.discount.toLocaleString()}</TableCell>
                        <TableCell>₱{r.net.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <span>{r.paymentMethod}</span>
                              {(r.paymentMethod === "GCash" || r.paymentMethod === "Maya" || r.paymentMethod === "Bank Transfer") && (
                                <span className={`text-xs ${r.verificationStatus === "verified" ? "text-green-600" :
                                  r.verificationStatus === "rejected" ? "text-red-600" :
                                    "text-amber-600"
                                  }`}>
                                  {r.verificationStatus === "verified" ? "✓ Verified" :
                                    r.verificationStatus === "rejected" ? "✗ Rejected" :
                                      "⏳ Pending Verification"}
                                </span>
                              )}
                            </div>
                            {(r.paymentMethod === "GCash" || r.paymentMethod === "Maya" || r.paymentMethod === "Bank Transfer") && (r as any).receiptUrl && (
                              <a
                                href={(r as any).receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                title={`View ${r.paymentMethod} Receipt`}
                              >
                                🧾
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {r.isManual ? (
                            <Badge variant="outline">Manual</Badge>
                          ) : (
                            "Auto"
                          )}
                        </TableCell>
                        <TableCell>
                          {r.isManual && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeManualTransaction(r.id)}
                            >
                              Remove
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <PaginationControls
                  currentPage={dailySalesPage}
                  totalPages={dailySalesTotalPages}
                  itemsPerPage={dailySalesItemsPerPage}
                  totalItems={daySales.length}
                  onPageChange={setDailySalesPage}
                  onItemsPerPageChange={setDailySalesItemsPerPage}
                  itemName="transactions"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification">
          <VerificationTabWrapper
            key="verification-tab"
            isAdminOnly={effectiveIsAdminOnly}
            adminOnlyLoading={adminOnlyLoading}
            onRefreshSalesData={() => loadManual(true)}
          />
        </TabsContent>
      </Tabs>

      {/* Raw table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Barber</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{dayjs(r.date).format("MMM DD, YYYY")}</TableCell>
                  <TableCell>{r.branch}</TableCell>
                  <TableCell>{r.barber}</TableCell>
                  <TableCell>
                    <Badge variant={r.appointmentType === "walk-in" ? "secondary" : "outline"}>
                      {r.appointmentType === "walk-in" ? "Walk-in" : "Reservation"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="max-w-[300px] truncate"
                    title={r.services}
                  >
                    {r.services}
                  </TableCell>
                  <TableCell>₱{r.gross.toLocaleString()}</TableCell>
                  <TableCell>₱{r.discount.toLocaleString()}</TableCell>
                  <TableCell>₱{r.net.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{r.paymentMethod}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === "completed"
                          ? "default"
                          : r.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <PaginationControls
            currentPage={transactionsPage}
            totalPages={transactionsTotalPages}
            itemsPerPage={transactionsItemsPerPage}
            totalItems={filtered.length}
            onPageChange={setTransactionsPage}
            onItemsPerPageChange={setTransactionsItemsPerPage}
            itemName="transactions"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesManagementPage;
