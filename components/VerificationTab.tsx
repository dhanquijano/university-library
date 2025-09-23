"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { ErrorDisplay } from "@/components/ErrorDisplay";
import { retryFetch, getUserFriendlyErrorMessage, debounce } from "@/lib/retry-utils";

import { VerificationStats } from "@/components/VerificationStats";
import GCashTransactionTable from "@/components/GCashTransactionTable";
import { ReceiptModal } from "@/components/ReceiptModal";
import {
  GCashTransaction,
  VerificationStats as VerificationStatsType,
  VerificationStatus,
  VerificationFilters,
  PaginationParams,
} from "@/types/gcash-verification";

interface VerificationTabProps {
  className?: string;
}

const VerificationTab: React.FC<VerificationTabProps> = ({ className }) => {
  // Debug logging
  useEffect(() => {
    console.log('VerificationTab mounted');
    return () => {
      console.log('VerificationTab unmounted');
    };
  }, []);

  // State for data
  const [transactions, setTransactions] = useState<GCashTransaction[]>([]);
  const [stats, setStats] = useState<VerificationStatsType>({
    pending: 0,
    verified: 0,
    rejected: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // State for filtering and search
  const [filters, setFilters] = useState<VerificationFilters>({
    status: "all",
    searchTerm: "",
    dateFrom: "",
    dateTo: "",
    branch: "",
  });

  // State for pagination
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 20,
    sortBy: "date",
    sortOrder: "desc",
  });

  // State for receipt modal
  const [receiptModal, setReceiptModal] = useState<{
    isOpen: boolean;
    receiptUrl: string;
    transactionId: string;
  }>({
    isOpen: false,
    receiptUrl: "",
    transactionId: "",
  });

  // Load initial data with retry logic
  const loadData = useCallback(async (showToast = true) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await retryFetch("/api/admin/sales/gcash-verification", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }, {
        maxAttempts: 3,
        delay: 1000,
        onRetry: (attempt, error) => {
          console.log(`Retry attempt ${attempt} for loading data:`, error.message);
          if (showToast) {
            toast.info(`Retrying... (${attempt}/3)`);
          }
        }
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to load verification data");
      }

      setTransactions(result.data.transactions || []);
      setStats(result.data.stats || { pending: 0, verified: 0, rejected: 0, total: 0 });
      setRetryCount(0);
      
      // Success toast is handled by the retry mechanism if needed
    } catch (err) {
      console.error("Error loading verification data:", err);
      const error = err instanceof Error ? err : new Error("Failed to load data");
      setError(error);
      
      if (showToast) {
        toast.error(getUserFriendlyErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Handle verification action with retry logic
  const handleVerify = async (transactionId: string) => {
    try {
      const response = await retryFetch("/api/admin/sales/verify-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId,
          action: "verified",
        }),
      }, {
        maxAttempts: 2,
        delay: 1000,
        onRetry: (attempt, error) => {
          console.log(`Retry attempt ${attempt} for verification:`, error.message);
          toast.info("Retrying verification...");
        }
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Verification failed");
      }

      // Update local state
      setTransactions(prev => 
        prev.map(tx => 
          tx.id === transactionId 
            ? {
                ...tx,
                verification: {
                  id: result.data?.verification?.id || "",
                  status: "verified" as VerificationStatus,
                  verifiedBy: result.data?.verification?.verifiedBy,
                  verifiedAt: result.data?.verification?.verifiedAt || new Date().toISOString(),
                }
              }
            : tx
        )
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        verified: prev.verified + 1,
      }));

      toast.success("Transaction verified successfully");
    } catch (err) {
      console.error("Error verifying transaction:", err);
      const error = err instanceof Error ? err : new Error("Failed to verify transaction");
      toast.error(getUserFriendlyErrorMessage(error));
      throw error; // Re-throw to let the component handle loading states
    }
  };

  // Handle rejection action with retry logic
  const handleReject = async (transactionId: string, reason: string) => {
    try {
      const response = await retryFetch("/api/admin/sales/verify-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId,
          action: "rejected",
          reason,
        }),
      }, {
        maxAttempts: 2,
        delay: 1000,
        onRetry: (attempt, error) => {
          console.log(`Retry attempt ${attempt} for rejection:`, error.message);
          toast.info("Retrying rejection...");
        }
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Rejection failed");
      }

      // Update local state
      setTransactions(prev => 
        prev.map(tx => 
          tx.id === transactionId 
            ? {
                ...tx,
                verification: {
                  id: result.data?.verification?.id || "",
                  status: "rejected" as VerificationStatus,
                  verifiedBy: result.data?.verification?.verifiedBy,
                  verifiedAt: result.data?.verification?.verifiedAt || new Date().toISOString(),
                  rejectionReason: reason,
                }
              }
            : tx
        )
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        rejected: prev.rejected + 1,
      }));

      toast.success("Transaction rejected successfully");
    } catch (err) {
      console.error("Error rejecting transaction:", err);
      const error = err instanceof Error ? err : new Error("Failed to reject transaction");
      toast.error(getUserFriendlyErrorMessage(error));
      throw error; // Re-throw to let the component handle loading states
    }
  };

  // Handle receipt click
  const handleReceiptClick = (receiptUrl: string, transactionId: string) => {
    setReceiptModal({
      isOpen: true,
      receiptUrl,
      transactionId,
    });
  };

  // Handle state update from child components
  const handleStateUpdate = (_transactionId: string, _newStatus: VerificationStatus) => {
    // This is handled by the verify/reject functions above
    // but we can add additional logic here if needed
  };

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by status
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter(tx => 
        (tx.verification?.status || "pending") === filters.status
      );
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.id.toLowerCase().includes(searchLower) ||
        tx.branch.toLowerCase().includes(searchLower) ||
        tx.barber.toLowerCase().includes(searchLower) ||
        tx.services.toLowerCase().includes(searchLower)
      );
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(tx =>
        dayjs(tx.date).isAfter(dayjs(filters.dateFrom).subtract(1, "day"))
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(tx =>
        dayjs(tx.date).isBefore(dayjs(filters.dateTo).add(1, "day"))
      );
    }

    // Filter by branch
    if (filters.branch && filters.branch !== "all") {
      filtered = filtered.filter(tx => tx.branch === filters.branch);
    }

    return filtered;
  }, [transactions, filters]);

  // Paginate filtered transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, pagination.page, pagination.limit]);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const totalItems = filteredTransactions.length;
    const totalPages = Math.ceil(totalItems / pagination.limit);
    const startItem = totalItems === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
    const endItem = Math.min(pagination.page * pagination.limit, totalItems);
    
    return {
      totalItems,
      totalPages,
      startItem,
      endItem,
      hasNextPage: pagination.page < totalPages,
      hasPrevPage: pagination.page > 1,
    };
  }, [filteredTransactions.length, pagination.page, pagination.limit]);

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ 
      ...prev, 
      limit: newLimit, 
      page: 1 // Reset to first page when changing limit
    }));
  };

  // Reset pagination when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filters]);

  // Get unique branches for filter dropdown
  const branches = useMemo(() => {
    const uniqueBranches = [...new Set(transactions.map(tx => tx.branch))];
    return uniqueBranches.sort();
  }, [transactions]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRetryCount(prev => prev + 1);
    loadData(true);
  }, [loadData]);

  // Debounced search to avoid excessive API calls
  const debouncedSearch = useMemo(
    () => debounce((searchTerm: string) => {
      setFilters(prev => ({ ...prev, searchTerm }));
    }, 300),
    []
  );

  // Show error state if there's an error and no data
  if (error && transactions.length === 0) {
    return (
      <ErrorBoundary>
        <div className={`space-y-6 ${className || ""}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">GCash Transaction Verification</h2>
              <p className="text-sm text-muted-foreground">
                Review and verify GCash payments with uploaded receipts
              </p>
            </div>
          </div>
          <ErrorDisplay
            error={error}
            title="Failed to Load Verification Data"
            onRetry={handleRefresh}
            retryDisabled={loading}
            showDetails={process.env.NODE_ENV === "development"}
          />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`space-y-6 ${className || ""}`}>
        {/* Header with refresh button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">GCash Transaction Verification</h2>
            <p className="text-sm text-muted-foreground">
              Review and verify GCash payments with uploaded receipts
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Error Alert for partial failures */}
        {error && transactions.length > 0 && (
          <ErrorDisplay
            error={error}
            variant="alert"
            onRetry={handleRefresh}
            retryDisabled={loading}
            retryText="Retry"
          />
        )}

        {/* Verification Statistics */}
        <VerificationStats 
          stats={stats} 
          loading={loading} 
          error={error?.message}
        />

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) => 
                  setFilters(prev => ({ 
                    ...prev, 
                    status: value as VerificationStatus | "all" 
                  }))
                }
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Branch Filter */}
            <div className="space-y-2">
              <Label htmlFor="branch-filter">Branch</Label>
              <Select
                value={filters.branch || "all"}
                onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, branch: value === "all" ? "" : value }))
                }
              >
                <SelectTrigger id="branch-filter">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => 
                  setFilters(prev => ({ ...prev, dateFrom: e.target.value }))
                }
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => 
                  setFilters(prev => ({ ...prev, dateTo: e.target.value }))
                }
              />
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search transactions..."
                  value={filters.searchTerm || ""}
                  onChange={(e) => debouncedSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.status !== "all" || (filters.branch && filters.branch !== "all") || filters.dateFrom || filters.dateTo || filters.searchTerm) && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {filters.status !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Status: {filters.status}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => setFilters(prev => ({ ...prev, status: "all" }))}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              {filters.branch && filters.branch !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Branch: {filters.branch}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => setFilters(prev => ({ ...prev, branch: "" }))}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              {filters.searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: {filters.searchTerm}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => setFilters(prev => ({ ...prev, searchTerm: "" }))}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({
                  status: "all",
                  searchTerm: "",
                  dateFrom: "",
                  dateTo: "",
                  branch: "",
                })}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>GCash Transactions</CardTitle>
            <div className="flex items-center gap-4">
              {/* Items per page selector */}
              <div className="flex items-center gap-2 text-sm">
                <Label htmlFor="items-per-page" className="text-muted-foreground">
                  Items per page:
                </Label>
                <Select
                  value={pagination.limit.toString()}
                  onValueChange={(value) => handleLimitChange(parseInt(value))}
                >
                  <SelectTrigger id="items-per-page" className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Showing {paginationInfo.startItem}-{paginationInfo.endItem} of {paginationInfo.totalItems} transactions
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <GCashTransactionTable
            transactions={paginatedTransactions}
            onVerify={handleVerify}
            onReject={handleReject}
            onReceiptClick={handleReceiptClick}
            onStateUpdate={handleStateUpdate}
            loading={loading}
          />

          {/* Pagination Controls */}
          {paginationInfo.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {paginationInfo.totalPages}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Previous Page Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!paginationInfo.hasPrevPage}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {/* Show first page if not in range */}
                  {pagination.page > 3 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        className="w-8 h-8 p-0"
                      >
                        1
                      </Button>
                      {pagination.page > 4 && (
                        <span className="text-muted-foreground px-1">...</span>
                      )}
                    </>
                  )}

                  {/* Show pages around current page */}
                  {Array.from({ length: paginationInfo.totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page >= Math.max(1, pagination.page - 2) && 
                      page <= Math.min(paginationInfo.totalPages, pagination.page + 2)
                    )
                    .map(page => (
                      <Button
                        key={page}
                        variant={page === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))
                  }

                  {/* Show last page if not in range */}
                  {pagination.page < paginationInfo.totalPages - 2 && (
                    <>
                      {pagination.page < paginationInfo.totalPages - 3 && (
                        <span className="text-muted-foreground px-1">...</span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(paginationInfo.totalPages)}
                        className="w-8 h-8 p-0"
                      >
                        {paginationInfo.totalPages}
                      </Button>
                    </>
                  )}
                </div>

                {/* Next Page Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!paginationInfo.hasNextPage}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                {paginationInfo.totalItems} total items
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={receiptModal.isOpen}
        onClose={() => setReceiptModal(prev => ({ ...prev, isOpen: false }))}
        receiptUrl={receiptModal.receiptUrl}
        transactionId={receiptModal.transactionId}
      />
    </div>
    </ErrorBoundary>
  );
};

export default VerificationTab;
export { VerificationTab };