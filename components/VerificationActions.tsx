"use client";

import React, { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { VerifiableTransaction, VerificationStatus } from "@/types/gcash-verification";
import { ErrorDisplay } from "@/components/ErrorDisplay";

interface VerificationActionsProps {
  transaction: VerifiableTransaction;
  onVerify: (transactionId: string) => Promise<void>;
  onReject: (transactionId: string, reason: string) => Promise<void>;
  onStateUpdate?: (transactionId: string, newStatus: VerificationStatus) => void;
}

const VerificationActions: React.FC<VerificationActionsProps> = ({
  transaction,
  onVerify,
  onReject,
  onStateUpdate,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [verifyError, setVerifyError] = useState<Error | null>(null);
  const [rejectError, setRejectError] = useState<Error | null>(null);

  const status = transaction.verification?.status || "pending";
  const isPending = status === "pending";

  // Handle verify confirmation
  const handleVerifyConfirm = async () => {
    setIsVerifying(true);
    setVerifyError(null);

    try {
      await onVerify(transaction.id);
      setShowVerifyDialog(false);
      onStateUpdate?.(transaction.id, "verified");
      // Don't show toast here as it's handled in the parent component
    } catch (error) {
      console.error("Failed to verify transaction:", error);
      const err = error instanceof Error ? error : new Error("Failed to verify transaction");
      setVerifyError(err);
      // Don't show toast here as it's handled in the parent component
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle reject confirmation
  const handleRejectConfirm = async () => {
    // Validate rejection reason
    const trimmedReason = rejectionReason.trim();
    if (!trimmedReason) {
      setReasonError("Rejection reason is required");
      return;
    }
    if (trimmedReason.length < 10) {
      setReasonError("Rejection reason must be at least 10 characters");
      return;
    }
    if (trimmedReason.length > 500) {
      setReasonError("Rejection reason must be less than 500 characters");
      return;
    }

    setIsRejecting(true);
    setRejectError(null);

    try {
      await onReject(transaction.id, trimmedReason);
      setShowRejectDialog(false);
      setRejectionReason("");
      setReasonError("");
      setRejectError(null);
      onStateUpdate?.(transaction.id, "rejected");
      // Don't show toast here as it's handled in the parent component
    } catch (error) {
      console.error("Failed to reject transaction:", error);
      const err = error instanceof Error ? error : new Error("Failed to reject transaction");
      setRejectError(err);
      // Don't show toast here as it's handled in the parent component
    } finally {
      setIsRejecting(false);
    }
  };

  // Handle rejection reason change
  const handleReasonChange = (value: string) => {
    setRejectionReason(value);
    if (reasonError) {
      setReasonError("");
    }
  };

  // Handle dialog close
  const handleRejectDialogClose = () => {
    if (!isRejecting) {
      setShowRejectDialog(false);
      setRejectionReason("");
      setReasonError("");
      setRejectError(null);
    }
  };

  const handleVerifyDialogClose = () => {
    if (!isVerifying) {
      setShowVerifyDialog(false);
      setVerifyError(null);
    }
  };

  // If not pending, show status message
  if (!isPending) {
    return (
      <div className="text-sm text-muted-foreground">
        {status === "verified" && "Transaction verified"}
        {status === "rejected" && "Transaction rejected"}
      </div>
    );
  }

  return (
    <>
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => setShowVerifyDialog(true)}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={isVerifying || isRejecting}
        >
          {isVerifying ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-1" />
          )}
          Verify
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setShowRejectDialog(true)}
          disabled={isVerifying || isRejecting}
        >
          {isRejecting ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4 mr-1" />
          )}
          Reject
        </Button>
      </div>

      {/* Verify Confirmation Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={handleVerifyDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to verify this {transaction.paymentMethod} transaction for{" "}
              <strong>₱{transaction.net.toLocaleString()}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2 text-sm">
              <div><strong>Date:</strong> {transaction.date} {transaction.time}</div>
              <div><strong>Branch:</strong> {transaction.branch}</div>
              <div><strong>Barber:</strong> {transaction.barber}</div>
              <div><strong>Services:</strong> {transaction.services}</div>
            </div>

            {verifyError && (
              <ErrorDisplay
                error={verifyError}
                variant="alert"
                showRetry={false}
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleVerifyDialogClose}
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyConfirm}
              disabled={isVerifying}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify Transaction
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={handleRejectDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-white">Reject Transaction</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this {transaction.paymentMethod} transaction for{" "}
              <strong>₱{transaction.net.toLocaleString()}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              {/* Transaction Details */}
              <div className="space-y-2 text-sm bg-muted/50 p-3 rounded">
                <div><strong>Date:</strong> {transaction.date} {transaction.time}</div>
                <div><strong>Branch:</strong> {transaction.branch}</div>
                <div><strong>Barber:</strong> {transaction.barber}</div>
                <div><strong>Services:</strong> {transaction.services}</div>
              </div>

              {/* Error Display */}
              {rejectError && (
                <ErrorDisplay
                  error={rejectError}
                  variant="alert"
                  showRetry={false}
                />
              )}

              {/* Rejection Reason Input */}
              <div className="space-y-2">
                <Label htmlFor="rejection-reason" className="text-white">
                  Rejection Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Enter the reason for rejecting this transaction (minimum 10 characters)..."
                  value={rejectionReason}
                  onChange={(e) => handleReasonChange(e.target.value)}
                  className={reasonError ? "border-red-500" : ""}
                  rows={4}
                  maxLength={500}
                  disabled={isRejecting}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{reasonError && <span className="text-red-500">{reasonError}</span>}</span>
                  <span>{rejectionReason.length}/500</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleRejectDialogClose}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={isRejecting || !rejectionReason.trim()}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Transaction
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VerificationActions;