"use client";

import React, { useState, useMemo } from "react";
import dayjs from "dayjs";
import { ChevronUp, ChevronDown, Image as ImageIcon, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { LoadingState, TableSkeleton } from "@/components/LoadingState";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerifiableTransaction, VerificationStatus } from "@/types/gcash-verification";
import VerificationActions from "@/components/VerificationActions";

interface VerificationTransactionTableProps {
  transactions: VerifiableTransaction[];
  onVerify: (transactionId: string) => Promise<void>;
  onReject: (transactionId: string, reason: string) => Promise<void>;
  onReceiptClick: (receiptUrl: string, transactionId: string) => void;
  onStateUpdate?: (transactionId: string, newStatus: VerificationStatus) => void;
  loading?: boolean;
}

type SortField = "date" | "amount" | "status" | "paymentMethod";
type SortOrder = "asc" | "desc";

const VerificationTransactionTable: React.FC<VerificationTransactionTableProps> = ({
  transactions,
  onVerify,
  onReject,
  onReceiptClick,
  onStateUpdate,
  loading = false,
}) => {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "date":
          aValue = new Date(`${a.date}T${a.time || "00:00"}`);
          bValue = new Date(`${b.date}T${b.time || "00:00"}`);
          break;
        case "amount":
          aValue = a.net;
          bValue = b.net;
          break;
        case "status":
          aValue = a.verification?.status || "pending";
          bValue = b.verification?.status || "pending";
          break;
        case "paymentMethod":
          aValue = a.paymentMethod;
          bValue = b.paymentMethod;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [transactions, sortField, sortOrder]);

  // Get status badge variant and icon
  const getStatusBadgeVariant = (status: VerificationStatus) => {
    switch (status) {
      case "verified":
        return "default"; // green
      case "rejected":
        return "destructive"; // red
      case "pending":
      default:
        return "secondary"; // gray
    }
  };

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-3 w-3" />;
      case "rejected":
        return <XCircle className="h-3 w-3" />;
      case "pending":
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Get payment method badge variant
  const getPaymentMethodBadgeVariant = (paymentMethod: string) => {
    switch (paymentMethod) {
      case "GCash":
        return "default";
      case "Maya":
        return "secondary";
      case "Bank Transfer":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <div className="p-4">
          <LoadingState message="Loading transactions..." />
        </div>
        <div className="p-4 border-t">
          <TableSkeleton rows={5} columns={9} />
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="flex items-center justify-center p-12">
          <div className="text-center space-y-2">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto" />
            <div className="text-lg font-medium text-muted-foreground">No transactions found</div>
            <div className="text-sm text-muted-foreground">
              Try adjusting your filters or check back later
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Receipt</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("date")}
            >
              Date & Time {renderSortIcon("date")}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("paymentMethod")}
            >
              Payment Method {renderSortIcon("paymentMethod")}
            </TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Barber</TableHead>
            <TableHead>Services</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 text-right"
              onClick={() => handleSort("amount")}
            >
              Amount {renderSortIcon("amount")}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("status")}
            >
              Status {renderSortIcon("status")}
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTransactions.map((transaction) => {
            const status = transaction.verification?.status || "pending";
            
            return (
              <TableRow key={transaction.id}>
                {/* Receipt Thumbnail */}
                <TableCell>
                  {transaction.receiptUrl ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-14 w-14 p-1 hover:bg-muted/50"
                      onClick={() => onReceiptClick(transaction.receiptUrl, transaction.id)}
                      title="Click to view full-size receipt"
                    >
                      <div className="relative h-12 w-12">
                        <img
                          src={transaction.receiptUrl}
                          alt={`Receipt for transaction ${transaction.id}`}
                          className="h-full w-full object-cover rounded border shadow-sm hover:shadow-md transition-shadow"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const fallback = target.parentElement?.querySelector('.receipt-fallback') as HTMLElement;
                            if (fallback) {
                              fallback.classList.remove("hidden");
                            }
                          }}
                          onLoad={(e) => {
                            const target = e.target as HTMLImageElement;
                            const fallback = target.parentElement?.querySelector('.receipt-fallback') as HTMLElement;
                            if (fallback) {
                              fallback.classList.add("hidden");
                            }
                          }}
                        />
                        <div className="receipt-fallback hidden h-full w-full bg-muted rounded border flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        {/* Overlay indicator for clickable */}
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 rounded transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                          <div className="bg-white/90 rounded-full p-1">
                            <ImageIcon className="h-3 w-3 text-gray-700" />
                          </div>
                        </div>
                      </div>
                    </Button>
                  ) : (
                    <div className="h-12 w-12 bg-muted/50 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                        <span className="text-xs text-muted-foreground leading-none">No Receipt</span>
                      </div>
                    </div>
                  )}
                </TableCell>

                {/* Date & Time */}
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">
                      {dayjs(transaction.date).format("MMM DD, YYYY")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {transaction.time || "No time"}
                    </div>
                  </div>
                </TableCell>

                {/* Payment Method */}
                <TableCell>
                  <Badge variant={getPaymentMethodBadgeVariant(transaction.paymentMethod)}>
                    {transaction.paymentMethod}
                  </Badge>
                </TableCell>

                {/* Branch */}
                <TableCell>{transaction.branch}</TableCell>

                {/* Barber */}
                <TableCell>{transaction.barber}</TableCell>

                {/* Services */}
                <TableCell>
                  <div className="max-w-xs truncate" title={transaction.services}>
                    {transaction.services}
                  </div>
                </TableCell>

                {/* Amount */}
                <TableCell className="text-right">
                  <div className="space-y-1">
                    <div className="font-medium">
                      ₱{transaction.net.toLocaleString()}
                    </div>
                    {transaction.discount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Gross: ₱{transaction.gross.toLocaleString()}
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <div className="space-y-2">
                    <Badge 
                      variant={getStatusBadgeVariant(status)}
                      className="flex items-center gap-1 w-fit"
                    >
                      {getStatusIcon(status)}
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                    {transaction.verification?.verifiedAt && (
                      <div className="text-xs text-muted-foreground">
                        <div className="font-medium">
                          {dayjs(transaction.verification.verifiedAt).format("MMM DD, YYYY")}
                        </div>
                        <div>
                          {dayjs(transaction.verification.verifiedAt).format("HH:mm")}
                        </div>
                      </div>
                    )}
                    {transaction.verification?.verifiedBy && (
                      <div className="text-xs text-muted-foreground">
                        by {transaction.verification.verifiedBy}
                      </div>
                    )}
                    {status === "rejected" && transaction.verification?.rejectionReason && (
                      <div className="text-xs text-red-600 max-w-32" title={transaction.verification.rejectionReason}>
                        {transaction.verification.rejectionReason.length > 30 
                          ? `${transaction.verification.rejectionReason.substring(0, 30)}...`
                          : transaction.verification.rejectionReason
                        }
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <VerificationActions
                    transaction={transaction}
                    onVerify={onVerify}
                    onReject={onReject}
                    onStateUpdate={onStateUpdate}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default VerificationTransactionTable;