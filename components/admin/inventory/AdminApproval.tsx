"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Input } from "@/components/ui/input";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  User,
  Calendar,
  Package,
  DollarSign,
  ArrowRightLeft,
  ShoppingCart,
  Building2,
  ChevronLeft,
  ChevronRight
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

interface BranchStock {
  branch: string;
  itemId: string;
  itemName: string;
  availableQuantity: number;
  unitPrice: number;
  originalItemId?: string; // Maps back to the requested item ID
}

interface FulfillmentPlan {
  itemId: string;
  itemName: string;
  requestedQuantity: number;
  transfers: Array<{
    fromBranch: string;
    quantity: number;
    unitPrice: number;
  }>;
  purchaseOrderQuantity: number;
  purchaseOrderPrice: number;
}

interface AdminApprovalProps {
  requests: ItemRequest[];
  branches: string[];
  selectedBranches: string[];
  onBranchChange: (branches: string[]) => void;
  onApproveRequest: (requestId: string, fulfillmentPlan: FulfillmentPlan[], notes?: string) => Promise<void>;
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Enhanced approval state
  const [branchStocks, setBranchStocks] = useState<BranchStock[]>([]);
  const [fulfillmentPlan, setFulfillmentPlan] = useState<FulfillmentPlan[]>([]);
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);

  // Filter requests based on selected branches
  const filteredRequests = selectedBranches.length === 0
    ? requests
    : requests.filter(request => selectedBranches.includes(request.branch));

  // Separate requests by status
  const pendingRequests = filteredRequests.filter(r => r.status === "pending");
  const reviewedRequests = filteredRequests.filter(r => r.status !== "pending");

  // Calculate pagination for pending requests
  const totalPendingRequests = pendingRequests.length;
  const totalPages = Math.ceil(totalPendingRequests / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPendingRequests = pendingRequests.slice(startIndex, endIndex);

  // Reset to page 1 if current page is beyond total pages
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Fetch available stock from other branches for the requested items
  const fetchBranchStocks = async (requestItems: RequestItem[], targetBranch: string) => {
    setIsLoadingStocks(true);
    try {
      const itemIds = requestItems.map(item => item.itemId);
      const response = await fetch(`/api/inventory/branch-stocks?itemIds=${itemIds.join(',')}&excludeBranch=${targetBranch}`);

      if (!response.ok) {
        throw new Error('Failed to fetch branch stocks');
      }

      const stocks = await response.json();
      console.log('Fetched branch stocks:', stocks);
      console.log('Requested item IDs:', itemIds);
      setBranchStocks(stocks);

      // Initialize fulfillment plan
      const initialPlan = requestItems.map(item => {
        // Find stocks that match this item by originalItemId (mapped from SKU)
        const availableStocks = stocks.filter((stock: BranchStock) =>
          stock.originalItemId === item.itemId
        );

        let remainingQuantity = item.quantity;
        const transfers: Array<{ fromBranch: string; quantity: number; unitPrice: number }> = [];

        // Try to fulfill from available stocks
        for (const stock of availableStocks) {
          if (remainingQuantity <= 0) break;

          const transferQuantity = Math.min(remainingQuantity, stock.availableQuantity);
          if (transferQuantity > 0) {
            transfers.push({
              fromBranch: stock.branch,
              quantity: transferQuantity,
              unitPrice: stock.unitPrice
            });
            remainingQuantity -= transferQuantity;
          }
        }

        return {
          itemId: item.itemId,
          itemName: item.itemName,
          requestedQuantity: item.quantity,
          transfers,
          purchaseOrderQuantity: remainingQuantity,
          purchaseOrderPrice: item.unitPrice
        };
      });

      setFulfillmentPlan(initialPlan);
    } catch (error) {
      console.error('Error fetching branch stocks:', error);
      toast.error('Failed to load branch inventory data');
    } finally {
      setIsLoadingStocks(false);
    }
  };

  const handleViewRequest = (request: ItemRequest) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
  };

  const handleApproveClick = async (request: ItemRequest) => {
    setSelectedRequest(request);
    setApprovalNotes("");
    setFulfillmentPlan([]);
    setBranchStocks([]);
    setIsApproveDialogOpen(true);

    // Fetch available stocks from other branches
    await fetchBranchStocks(request.items, request.branch);
  };

  const handleRejectClick = (request: ItemRequest) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };

  const updateTransferQuantity = (itemId: string, fromBranch: string, newQuantity: number) => {
    setFulfillmentPlan(prev => prev.map(item => {
      if (item.itemId !== itemId) return item;

      // Check if transfer already exists
      const existingTransferIndex = item.transfers.findIndex(t => t.fromBranch === fromBranch);
      let updatedTransfers = [...item.transfers];

      if (existingTransferIndex >= 0) {
        // Update existing transfer
        updatedTransfers[existingTransferIndex] = {
          ...updatedTransfers[existingTransferIndex],
          quantity: Math.max(0, newQuantity)
        };
      } else if (newQuantity > 0) {
        // Add new transfer
        const branchStock = branchStocks.find(s =>
          s.originalItemId === itemId && s.branch === fromBranch
        );
        if (branchStock) {
          updatedTransfers.push({
            fromBranch,
            quantity: Math.max(0, newQuantity),
            unitPrice: branchStock.unitPrice
          });
        }
      }

      // Remove transfers with 0 quantity
      updatedTransfers = updatedTransfers.filter(t => t.quantity > 0);

      const totalTransferred = updatedTransfers.reduce((sum, t) => sum + t.quantity, 0);
      const purchaseOrderQuantity = Math.max(0, item.requestedQuantity - totalTransferred);

      return {
        ...item,
        transfers: updatedTransfers,
        purchaseOrderQuantity
      };
    }));
  };

  const handleApproveConfirm = async () => {
    if (!selectedRequest) return;

    try {
      await onApproveRequest(selectedRequest.id, fulfillmentPlan, approvalNotes);
      setIsApproveDialogOpen(false);
      setSelectedRequest(null);
      setApprovalNotes("");
      setFulfillmentPlan([]);
      setBranchStocks([]);
      toast.success("Request approved with fulfillment plan");
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

  const getTotalTransferCost = () => {
    return fulfillmentPlan.reduce((total, item) => {
      const transferCost = item.transfers.reduce((sum, transfer) =>
        sum + (transfer.quantity * transfer.unitPrice), 0
      );
      return total + transferCost;
    }, 0);
  };

  const getTotalPurchaseOrderCost = () => {
    return fulfillmentPlan.reduce((total, item) =>
      total + (item.purchaseOrderQuantity * item.purchaseOrderPrice), 0
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Request Approvals</h2>
          <p className="text-muted-foreground">
            Review requests and choose between branch transfers or purchase orders
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
              {paginatedPendingRequests.map((request) => (
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
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalPendingRequests)} of {totalPendingRequests} pending requests
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <Label className="text-sm">Rows per page:</Label>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
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
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
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
        <DialogContent className="max-w-5xl  ">
          <DialogHeader className="text-white">
            <DialogTitle>Approve Request - {selectedRequest?.requestNumber}</DialogTitle>
            <DialogDescription>
              Review requested items and choose transfer quantities from available branches
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {isLoadingStocks ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading branch inventory data...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Requested Items</h3>

                  {selectedRequest.items.map((requestedItem) => {
                    const availableStocks = branchStocks.filter(stock =>
                      stock.originalItemId === requestedItem.itemId
                    );
                    const currentPlan = fulfillmentPlan.find(plan => plan.itemId === requestedItem.itemId);
                    const totalTransferred = currentPlan?.transfers.reduce((sum, t) => sum + t.quantity, 0) || 0;
                    const remainingQuantity = requestedItem.quantity - totalTransferred;

                    return (
                      <Card key={requestedItem.itemId} className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center justify-between">
                            <span>{requestedItem.itemName}</span>
                            <div className="flex gap-2">
                              <Badge variant="outline">Requested: {requestedItem.quantity}</Badge>
                              <Badge variant={remainingQuantity > 0 ? "destructive" : "default"}>
                                Remaining: {remainingQuantity}
                              </Badge>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Available Stock from Other Branches */}
                          {availableStocks.length > 0 ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                                <ArrowRightLeft className="h-4 w-4" />
                                Available from Other Branches
                              </div>
                              {availableStocks.map((stock, index) => {
                                const currentTransfer = currentPlan?.transfers.find(t => t.fromBranch === stock.branch);
                                const transferQuantity = currentTransfer?.quantity || 0;

                                return (
                                  <div key={index} className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                    <div className="flex-1">
                                      <div className="font-medium">{getBranchName(stock.branch)}</div>
                                      <div className="text-sm text-muted-foreground">
                                        Available: {stock.availableQuantity} units • ₱{stock.unitPrice.toLocaleString()} per unit
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Label className="text-sm">Transfer:</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max={Math.min(stock.availableQuantity, requestedItem.quantity)}
                                        value={transferQuantity}
                                        onChange={(e) => updateTransferQuantity(
                                          requestedItem.itemId,
                                          stock.branch,
                                          parseInt(e.target.value) || 0
                                        )}
                                        className="w-20"
                                      />
                                      <span className="text-sm text-muted-foreground">units</span>
                                    </div>
                                    <div className="text-right min-w-[80px]">
                                      <div className="font-medium">
                                        ₱{(transferQuantity * stock.unitPrice).toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-3 bg-gray-50 rounded-lg text-center text-muted-foreground">
                              <Package className="h-6 w-6 mx-auto mb-2" />
                              No stock available in other branches
                            </div>
                          )}

                          {/* Purchase Order for Remaining */}
                          {remainingQuantity > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
                                <ShoppingCart className="h-4 w-4" />
                                Purchase Order Required
                              </div>
                              <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
                                <ShoppingCart className="h-4 w-4 text-orange-600" />
                                <div className="flex-1">
                                  <div className="font-medium">New Purchase Order</div>
                                  <div className="text-sm text-muted-foreground">
                                    ₱{requestedItem.unitPrice.toLocaleString()} per unit
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="font-medium">Quantity: {remainingQuantity}</div>
                                </div>
                                <div className="text-right min-w-[80px]">
                                  <div className="font-medium">
                                    ₱{(remainingQuantity * requestedItem.unitPrice).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {remainingQuantity === 0 && (
                            <div className="text-center py-2 text-green-600 font-medium">
                              <CheckCircle className="h-5 w-5 inline mr-2" />
                              Fully covered by transfers
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    ₱{getTotalTransferCost().toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Transfer Cost</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-600">
                    ₱{getTotalPurchaseOrderCost().toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Purchase Order Cost</div>
                </div>
              </div>

              {/* Approval Notes */}
              <div className="space-y-2">
                <Label htmlFor="approval-notes" className="text-white">Approval Notes (Optional)</Label>
                <Textarea
                  id="approval-notes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes about this approval..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApproveConfirm}
              disabled={isLoadingStocks}
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