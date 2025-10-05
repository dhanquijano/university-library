"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Package, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
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

interface RequestOrdersProps {
  requests: ItemRequest[];
  suppliers: string[];
  branches: string[];
  selectedBranches: string[];
  onBranchChange: (branches: string[]) => void;
  lowStockItems: Array<{
    id: string;
    name: string;
    currentQuantity: number;
    reorderThreshold: number;
    supplier: string;
    branch: string;
    unitPrice: number;
  }>;
  onCreateRequest: (request: any) => Promise<void>;
}

const RequestOrders: React.FC<RequestOrdersProps> = ({
  requests,
  suppliers,
  branches,
  selectedBranches,
  onBranchChange,
  lowStockItems,
  onCreateRequest,
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<RequestItem[]>([]);
  const [requestNotes, setRequestNotes] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  // Filter requests based on selected branches
  const filteredRequests = selectedBranches.length === 0 
    ? requests 
    : requests.filter(request => selectedBranches.includes(request.branch));

  const handleAddItem = (item: any) => {
    const existingItem = selectedItems.find(si => si.itemId === item.id);
    if (existingItem) {
      toast.error("Item already added to request");
      return;
    }

    const newItem: RequestItem = {
      itemId: item.id,
      itemName: item.name,
      quantity: Math.max(1, item.reorderThreshold - item.currentQuantity),
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * Math.max(1, item.reorderThreshold - item.currentQuantity),
      reason: "Low stock replenishment",
    };

    setSelectedItems([...selectedItems, newItem]);
  };

  const handleUpdateItemQuantity = (itemId: string, quantity: number) => {
    setSelectedItems(selectedItems.map(item => 
      item.itemId === itemId 
        ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
        : item
    ));
  };

  const handleUpdateItemReason = (itemId: string, reason: string) => {
    setSelectedItems(selectedItems.map(item => 
      item.itemId === itemId 
        ? { ...item, reason }
        : item
    ));
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter(item => item.itemId !== itemId));
  };

  const handleSubmitRequest = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please add at least one item to the request");
      return;
    }

    if (!selectedBranch) {
      toast.error("Please select a branch");
      return;
    }

    const totalAmount = selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);

    const requestData = {
      items: selectedItems,
      totalAmount,
      notes: requestNotes,
      branch: selectedBranch,
    };

    try {
      await onCreateRequest(requestData);
      setSelectedItems([]);
      setRequestNotes("");
      setSelectedBranch("");
      setIsCreateDialogOpen(false);
      toast.success("Request submitted successfully");
    } catch (error) {
      toast.error("Failed to submit request");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Item Requests</h2>
          <p className="text-muted-foreground">
            Request items for your branch - requires admin approval
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Item Request</DialogTitle>
              <DialogDescription>
                Select items you need for your branch. Admin approval is required.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Branch Selection */}
              <div className="space-y-2">
                <Label htmlFor="branch">Branch *</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch} value={branch}>
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Low Stock Items */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Available Items</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Reorder Level</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <Badge variant={item.currentQuantity === 0 ? "destructive" : "secondary"}>
                              {item.currentQuantity}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.reorderThreshold}</TableCell>
                          <TableCell>₱{item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell>{item.supplier}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleAddItem(item)}
                              disabled={selectedItems.some(si => si.itemId === item.id)}
                            >
                              {selectedItems.some(si => si.itemId === item.id) ? "Added" : "Add"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Selected Items */}
              {selectedItems.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Requested Items</h3>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedItems.map((item) => (
                          <TableRow key={item.itemId}>
                            <TableCell className="font-medium">{item.itemName}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemQuantity(item.itemId, parseInt(e.target.value) || 1)}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>₱{item.unitPrice.toLocaleString()}</TableCell>
                            <TableCell>₱{item.totalPrice.toLocaleString()}</TableCell>
                            <TableCell>
                              <Input
                                value={item.reason}
                                onChange={(e) => handleUpdateItemReason(item.itemId, e.target.value)}
                                placeholder="Reason for request"
                                className="w-40"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemoveItem(item.itemId)}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      Total: ₱{selectedItems.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="Any additional information about this request..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitRequest}>
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Branch Filter */}
      <BranchFilter
        branches={branches}
        selectedBranches={selectedBranches}
        onBranchChange={onBranchChange}
      />

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            My Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Requested Date</TableHead>
                <TableHead>Reviewed By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.requestNumber}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{request.items.length} items</TableCell>
                  <TableCell>₱{request.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>{request.branch}</TableCell>
                  <TableCell>
                    {new Date(request.requestedDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{request.reviewedBy || "-"}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredRequests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No requests found. Create your first request to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestOrders;