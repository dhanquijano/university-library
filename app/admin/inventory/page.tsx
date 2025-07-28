"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign,
  Users,
  ShoppingCart,
  Activity,
  Settings
} from "lucide-react";

import InventoryDashboard from "@/components/admin/inventory/InventoryDashboard";
import ItemManagement from "@/components/admin/inventory/ItemManagement";
import StockMovement from "@/components/admin/inventory/StockMovement";
import PurchaseOrders from "@/components/admin/inventory/PurchaseOrders";

// Mock data - in real app, this would come from API
const mockInventoryStats = {
  totalItems: 156,
  lowStockItems: 12,
  outOfStockItems: 3,
  expiringSoonItems: 8,
  totalValue: 125000,
  recentTransactions: 45,
  pendingOrders: 7,
  activeSuppliers: 15,
};

const mockRecentActivity = [
  {
    id: "1",
    action: "Stock In",
    item: "Professional Hair Clippers",
    quantity: 10,
    user: "Admin User",
    timestamp: "2024-01-15T10:30:00Z",
    type: "in" as const,
  },
  {
    id: "2",
    action: "Stock Out",
    item: "Hair Shampoo",
    quantity: 5,
    user: "Barber John",
    timestamp: "2024-01-15T09:15:00Z",
    type: "out" as const,
  },
  {
    id: "3",
    action: "Item Updated",
    item: "Styling Gel",
    quantity: 0,
    user: "Admin User",
    timestamp: "2024-01-15T08:45:00Z",
    type: "update" as const,
  },
];

const mockInventoryItems = [
  {
    id: "1",
    name: "Professional Hair Clippers",
    sku: "HC-001",
    category: "Tools",
    quantity: 15,
    reorderThreshold: 10,
    unitPrice: 2500,
    supplier: "Barber Supply Co.",
    expirationDate: undefined,
    status: "in-stock" as const,
  },
  {
    id: "2",
    name: "Hair Shampoo",
    sku: "HS-002",
    category: "Hair Products",
    quantity: 8,
    reorderThreshold: 10,
    unitPrice: 350,
    supplier: "Beauty Supplies Inc.",
    expirationDate: "2024-06-15",
    status: "low-stock" as const,
  },
  {
    id: "3",
    name: "Styling Gel",
    sku: "SG-003",
    category: "Hair Products",
    quantity: 0,
    reorderThreshold: 5,
    unitPrice: 280,
    supplier: "Beauty Supplies Inc.",
    expirationDate: "2024-05-20",
    status: "out-of-stock" as const,
  },
  {
    id: "4",
    name: "Disposable Razors",
    sku: "DR-004",
    category: "Tools",
    quantity: 50,
    reorderThreshold: 20,
    unitPrice: 150,
    supplier: "Barber Supply Co.",
    expirationDate: undefined,
    status: "in-stock" as const,
  },
];

const mockStockTransactions = [
  {
    id: "1",
    itemId: "1",
    itemName: "Professional Hair Clippers",
    type: "in" as const,
    quantity: 10,
    previousQuantity: 5,
    newQuantity: 15,
    user: "Admin User",
    notes: "Restock from supplier",
    timestamp: "2024-01-15T10:30:00Z",
    reason: "Restock",
  },
  {
    id: "2",
    itemId: "2",
    itemName: "Hair Shampoo",
    type: "out" as const,
    quantity: 5,
    previousQuantity: 13,
    newQuantity: 8,
    user: "Barber John",
    notes: "Used during haircut service",
    timestamp: "2024-01-15T09:15:00Z",
    reason: "Used during service",
  },
];

const mockPurchaseOrders = [
  {
    id: "1",
    orderNumber: "PO-2024-001",
    supplier: "Barber Supply Co.",
    status: "ordered" as const,
    items: [
      {
        itemId: "3",
        itemName: "Styling Gel",
        quantity: 20,
        unitPrice: 280,
        totalPrice: 5600,
      },
    ],
    totalAmount: 5600,
    requestedBy: "Admin User",
    requestedDate: "2024-01-10T14:30:00Z",
    orderedDate: "2024-01-12T09:15:00Z",
    notes: "Urgent restock needed",
    branch: "Main Branch",
  },
  {
    id: "2",
    orderNumber: "PO-2024-002",
    supplier: "Beauty Supplies Inc.",
    status: "requested" as const,
    items: [
      {
        itemId: "2",
        itemName: "Hair Shampoo",
        quantity: 15,
        unitPrice: 350,
        totalPrice: 5250,
      },
    ],
    totalAmount: 5250,
    requestedBy: "Manager Sarah",
    requestedDate: "2024-01-14T16:45:00Z",
    notes: "Regular restock",
    branch: "Downtown Branch",
  },
];

const mockCategories = ["Tools", "Hair Products", "Cleaning Supplies", "Accessories"];
const mockSuppliers = ["Barber Supply Co.", "Beauty Supplies Inc.", "Professional Tools Ltd.", "Hair Care Plus"];
const mockBranches = ["Main Branch", "Downtown Branch", "Mall Branch"];
const mockUsers = ["Admin User", "Manager Sarah", "Barber John", "Barber Mike"];

const InventoryPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [inventoryItems, setInventoryItems] = useState(mockInventoryItems);
  const [stockTransactions, setStockTransactions] = useState(mockStockTransactions);
  const [purchaseOrders, setPurchaseOrders] = useState(mockPurchaseOrders);

  const handleAddItem = (item: any) => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
    };
    setInventoryItems([...inventoryItems, newItem]);
    toast.success("Item added successfully");
  };

  const handleUpdateItem = (id: string, updates: any) => {
    setInventoryItems(inventoryItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
    toast.success("Item updated successfully");
  };

  const handleDeleteItem = (id: string) => {
    setInventoryItems(inventoryItems.filter(item => item.id !== id));
    toast.success("Item deleted successfully");
  };

  const handleAddTransaction = (transaction: any) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setStockTransactions([newTransaction, ...stockTransactions]);
    
    // Update item quantity
    setInventoryItems(inventoryItems.map(item => 
      item.id === transaction.itemId 
        ? { ...item, quantity: transaction.newQuantity }
        : item
    ));
    
    toast.success("Transaction recorded successfully");
  };

  const handleCreateOrder = (order: any) => {
    const newOrder = {
      ...order,
      id: Date.now().toString(),
      orderNumber: `PO-2024-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
      requestedDate: new Date().toISOString(),
    };
    setPurchaseOrders([newOrder, ...purchaseOrders]);
    toast.success("Purchase order created successfully");
  };

  const handleUpdateOrderStatus = (orderId: string, status: any) => {
    setPurchaseOrders(purchaseOrders.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            status,
            orderedDate: status === 'ordered' ? new Date().toISOString() : order.orderedDate,
            receivedDate: status === 'received' ? new Date().toISOString() : order.receivedDate,
          }
        : order
    ));
    toast.success(`Order status updated to ${status}`);
  };

  const lowStockItems = inventoryItems
    .filter(item => item.quantity <= item.reorderThreshold)
    .map(item => ({
      id: item.id,
      name: item.name,
      currentQuantity: item.quantity,
      reorderThreshold: item.reorderThreshold,
    }));

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
        <p className="text-gray-600">Manage your barbershop inventory, track stock movements, and handle purchase orders</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Items
          </TabsTrigger>
          <TabsTrigger value="movement" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Stock Movement
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Purchase Orders
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <InventoryDashboard 
            stats={mockInventoryStats}
            recentActivity={mockRecentActivity}
          />
        </TabsContent>

        <TabsContent value="items" className="space-y-6">
          <ItemManagement 
            items={inventoryItems}
            categories={mockCategories}
            suppliers={mockSuppliers}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
          />
        </TabsContent>

        <TabsContent value="movement" className="space-y-6">
          <StockMovement 
            transactions={stockTransactions}
            items={inventoryItems.map(item => ({ id: item.id, name: item.name, quantity: item.quantity }))}
            users={mockUsers}
            onAddTransaction={handleAddTransaction}
          />
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <PurchaseOrders 
            orders={purchaseOrders}
            suppliers={mockSuppliers}
            branches={mockBranches}
            lowStockItems={lowStockItems}
            users={mockUsers}
            onCreateOrder={handleCreateOrder}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Manage user roles and permissions for inventory management.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Admin</span>
                    <Badge>Full Access</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Manager</span>
                    <Badge variant="secondary">Limited Access</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Staff</span>
                    <Badge variant="outline">View Only</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Configure inventory alerts and notifications.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Low Stock Alerts</span>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Expiration Alerts</span>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Order Status Updates</span>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryPage;