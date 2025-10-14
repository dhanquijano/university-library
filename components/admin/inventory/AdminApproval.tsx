"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useBranchMap, useAdminRole } from "@/lib/admin-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  User,
  Calendar,
  Package,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";
import BranchFilter from "./BranchFilter";

interface RequestItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reason: string;
}

interface ItemRequest {
  id: string;
  requestNumber: string;
  status: "pending" | "approved" | "rejected";
  items: RequestItem[];
  totalAmount: number;
  requestedBy: string;
  requestedDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
  notes?: string;
  rejectionReason?: string;
  branch: string;
}

interface AdminApprovalProps {
  requests: ItemRequest[];
  branches: string[];
  selectedBranches: string[];
  onBranchChange: (branches: string[]) => void;
  onApproveRequest: (requestId: string, notes?: string) => Promise<void>;
  onRejectRequest: (requestId: string, reason: string) => Promise<void>;
}

const AdminApproval: React.FC<AdminApprovalProps> = ({
  requests,
  branches,
  selectedBranches,
  onBranchChange,
  onApproveRequest,
  onRejectRequest,
}) => {
  const { getBranchName } = useBranchMap();
  const { userRole } = useAdminRole();
  const isManager = userRole === "MANAGER";
  const [selectedRequest, setSelectedRequest] = useState<ItemRequest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Filter requests based on selected branches
  const filteredRequests = selectedBranches.length === 0
    ? requests
    : requests.filter(request => selectedBranches.includes(request.branch));

  // Separate requests by status
  const pendingRequests = filteredRequests.filter(r => r.status === "pending");
  const reviewedRequests = filteredRequests.filter(r => r.status !== "pending");

  const handleViewRequest = (request: ItemRequest) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
  };

  const handleApproveClick = (request: ItemRequest) => {
    setSelectedRequest(request);
    setApprovalNotes("");
    setIsApproveDialogOpen(true);
  };

  const handleRejectClick = (request: ItemRequest) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedRequest) return;

    try {
      await onApproveRequest(selectedRequest.id, approvalNotes);
      setIsApproveDialogOpen(false);
      setSelectedRequest(null);
      setApprovalNotes("");
      toast.success("Request approved - Stock levels and purchase order updated");
    } catch (error) {
      toast.error("Failed to approve request");
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      await onRejectRequest(selectedRequest.id, rejectionReason);
      setIsRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
      toast.success("Request rejected");
    } catch (error) {
      toast.error("Failed to reject request");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending Review
        </Badge>;
      case "approved":
        return <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>;
      case "rejected":
        return <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (request: ItemRequest) => {
    const hasOutOfStock = request.items.some(item =>
      item.reason.toLowerCase().includes("out of stock") ||
      item.reason.toLowerCase().includes("urgent")
    );

    if (hasOutOfStock) {
      return <Badge variant="destructive" className="text-xs">High Priority</Badge>;
    }

    return <Badge variant="secondary" className="text-xs">Normal</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Request Approvals</h2>
          <p className="text-muted-foreground">
            Review and approve item requests from managers
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {pendingRequests.length} pending requests
          </div>
        </div>
      </div>

      {/* Branch Filter - Hidden for managers */}
      {!isManager && (
        <BranchFilter
          branches={branches}
          selectedBranches={selectedBranches}
          onBranchChange={onBranchChange}
        />
      )}

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            Pending Requests ({pendingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.requestNumber}</TableCell>
                  <TableCell>{getPriorityBadge(request)}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {request.requestedBy}
                  </TableCell>
                  <TableCell>{getBranchName(request.branch)}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {request.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="text-sm">
                          {item.itemName} ({item.quantity})
                        </div>
                      ))}
                      {request.items.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{request.items.length - 2} more items
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">₱{request.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    {new Date(request.requestedDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewRequest(request)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApproveClick(request)}
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectClick(request)}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pendingRequests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No pending requests to review.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviewed Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Reviewed Requests ({reviewedRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Reviewed By</TableHead>
                <TableHead>Review Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviewedRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.requestNumber}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{request.requestedBy}</TableCell>
                  <TableCell>{getBranchName(request.branch)}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {request.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="text-sm">
                          {item.itemName} ({item.quantity})
                        </div>
                      ))}
                      {request.items.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{request.items.length - 2} more items
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>₱{request.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>{request.reviewedBy || "-"}</TableCell>
                  <TableCell>
                    {request.reviewedDate
                      ? new Date(request.reviewedDate).toLocaleDateString()
                      : "-"
                    }
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewRequest(request)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {reviewedRequests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No reviewed requests found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Request Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-white">
            <DialogTitle >Request Details - {selectedRequest?.requestNumber}</DialogTitle>
            <DialogDescription >
              Review the complete request information
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4 tex">
                <div className="space-y-2 text-white">
                  <Label>Status</Label>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div className="space-y-2 text-white">
                  <Label>Priority</Label>
                  <div>{getPriorityBadge(selectedRequest)}</div>
                </div>
                <div className="space-y-2 text-white">
                  <Label>Requested By</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {selectedRequest.requestedBy}
                  </div>
                </div>
                <div className="space-y-2 text-white">
                  <Label>Branch</Label>
                  <div>{selectedRequest.branch}</div>
                </div>
                <div className="space-y-2 text-white">
                  <Label>Request Date</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedRequest.requestedDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="space-y-2 text-white">
                  <Label>Total Amount</Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    ₱{selectedRequest.totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4 text-white">
                <Label>Requested Items</Label>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRequest.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₱{item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell>₱{item.totalPrice.toLocaleString()}</TableCell>
                          <TableCell>{item.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <div className="space-y-2 ">
                  <Label>Request Notes</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    {selectedRequest.notes}
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedRequest.status === "rejected" && selectedRequest.rejectionReason && (
                <div className="space-y-2">
                  <Label>Rejection Reason</Label>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    {selectedRequest.rejectionReason}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader className="text-white">
            <DialogTitle>Approve Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this request? This will create a purchase order and update stock levels for the requested items.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2 ">
              <Label htmlFor="approval-notes " className="text-white">Approval Notes (Optional)</Label>
              <Textarea
                id="approval-notes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApproveConfirm}
            >
              Approve Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader className="text-white">
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 ">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason " className="text-white">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                rows={3}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim()}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApproval;