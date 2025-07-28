import React, { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  ShoppingCart,
  Clock,
  CheckCircle,
  Truck,
  AlertTriangle,
  DollarSign,
  Calendar,
  User
} from "lucide-react";

interface PurchaseOrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: string;
  status: 'requested' | 'ordered' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  totalAmount: number;
  requestedBy: string;
  requestedDate: string;
  orderedDate?: string;
  receivedDate?: string;
  notes: string;
  branch: string;
}

interface PurchaseOrdersProps {
  orders: PurchaseOrder[];
  suppliers: string[];
  branches: string[];
  lowStockItems: Array<{ id: string; name: string; currentQuantity: number; reorderThreshold: number }>;
  users: string[];
  onCreateOrder: (order: Omit<PurchaseOrder, 'id' | 'orderNumber' | 'requestedDate'>) => void;
  onUpdateOrderStatus: (orderId: string, status: PurchaseOrder['status']) => void;
}

const PurchaseOrders = ({ 
  orders, 
  suppliers, 
  branches, 
  lowStockItems, 
  users, 
  onCreateOrder, 
  onUpdateOrderStatus 
}: PurchaseOrdersProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    supplier: '',
    items: [] as PurchaseOrderItem[],
    requestedBy: '',
    notes: '',
    branch: '',
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <Badge className="bg-yellow-100 text-yellow-800">Requested</Badge>;
      case 'ordered':
        return <Badge className="bg-blue-100 text-blue-800">Ordered</Badge>;
      case 'received':
        return <Badge className="bg-green-100 text-green-800">Received</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'requested':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'ordered':
        return <ShoppingCart className="h-4 w-4 text-blue-600" />;
      case 'received':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleCreateOrder = () => {
    const order = {
      supplier: newOrder.supplier,
      items: newOrder.items,
      totalAmount: newOrder.items.reduce((sum, item) => sum + item.totalPrice, 0),
      requestedBy: newOrder.requestedBy,
      notes: newOrder.notes,
      branch: newOrder.branch,
    };

    onCreateOrder(order);
    setNewOrder({
      supplier: '',
      items: [],
      requestedBy: '',
      notes: '',
      branch: '',
    });
    setIsCreateDialogOpen(false);
  };

  const addItemToOrder = (itemId: string) => {
    const item = lowStockItems.find(i => i.id === itemId);
    if (!item) return;

    const existingItem = newOrder.items.find(i => i.itemId === itemId);
    if (existingItem) {
      setNewOrder({
        ...newOrder,
        items: newOrder.items.map(i => 
          i.itemId === itemId 
            ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice }
            : i
        )
      });
    } else {
      const newItem: PurchaseOrderItem = {
        itemId: item.id,
        itemName: item.name,
        quantity: 1,
        unitPrice: 0, // This would be fetched from supplier catalog
        totalPrice: 0,
      };
      setNewOrder({
        ...newOrder,
        items: [...newOrder.items, newItem]
      });
    }
  };

  const removeItemFromOrder = (itemId: string) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.filter(i => i.itemId !== itemId)
    });
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.map(i => 
        i.itemId === itemId 
          ? { ...i, quantity, totalPrice: quantity * i.unitPrice }
          : i
      )
    });
  };

  const updateItemPrice = (itemId: string, unitPrice: number) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.map(i => 
        i.itemId === itemId 
          ? { ...i, unitPrice, totalPrice: i.quantity * unitPrice }
          : i
      )
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Purchase Orders</h2>
          <p className="text-gray-600">Manage restocking requests and purchase orders</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
              <DialogDescription>
                Create a new purchase order for restocking items.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Select value={newOrder.supplier} onValueChange={(value) => setNewOrder({ ...newOrder, supplier: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier} value={supplier}>
                          {supplier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="branch">Branch</Label>
                  <Select value={newOrder.branch} onValueChange={(value) => setNewOrder({ ...newOrder, branch: value })}>
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
              </div>
              <div>
                <Label htmlFor="requestedBy">Requested By</Label>
                <Select value={newOrder.requestedBy} onValueChange={(value) => setNewOrder({ ...newOrder, requestedBy: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user} value={user}>
                        {user}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Low Stock Items */}
              <div>
                <Label>Add Items from Low Stock</Label>
                <div className="mt-2 space-y-2">
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          Current: {item.currentQuantity} | Threshold: {item.reorderThreshold}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addItemToOrder(item.id)}
                        disabled={newOrder.items.some(i => i.itemId === item.id)}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Items */}
              {newOrder.items.length > 0 && (
                <div>
                  <Label>Order Items</Label>
                  <div className="mt-2 space-y-2">
                    {newOrder.items.map((item) => (
                      <div key={item.itemId} className="flex items-center gap-4 p-2 border rounded">
                        <div className="flex-1">
                          <div className="font-medium">{item.itemName}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Qty:</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.itemId, parseInt(e.target.value) || 0)}
                            className="w-16"
                            min="1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Price:</Label>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItemPrice(item.itemId, parseFloat(e.target.value) || 0)}
                            className="w-20"
                            min="0"
                          />
                        </div>
                        <div className="text-sm font-medium">
                          ₱{(item.quantity * item.unitPrice).toLocaleString()}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeItemFromOrder(item.itemId)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                  placeholder="Additional notes for this order..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrder} disabled={newOrder.items.length === 0}>
                Create Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Purchase Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono">{order.orderNumber}</TableCell>
                  <TableCell>{order.supplier}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      {getStatusBadge(order.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.items.length} items
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {order.totalAmount.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>{order.branch}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {order.requestedBy}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(order.requestedDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {order.status === 'requested' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => onUpdateOrderStatus(order.id, 'ordered')}
                          >
                            Mark Ordered
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateOrderStatus(order.id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {order.status === 'ordered' && (
                        <Button
                          size="sm"
                          onClick={() => onUpdateOrderStatus(order.id, 'received')}
                        >
                          Mark Received
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requested</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'requested').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordered</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {orders.filter(o => o.status === 'ordered').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
            <Truck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'received').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ₱{orders
                .filter(o => o.status === 'ordered' || o.status === 'requested')
                .reduce((sum, o) => sum + o.totalAmount, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending orders
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PurchaseOrders;