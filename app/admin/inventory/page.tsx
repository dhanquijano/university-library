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
  Settings,
  BarChart3,
  CheckCircle
} from "lucide-react";

import InventoryDashboard from "@/components/admin/inventory/InventoryDashboard";
import ItemManagement from "@/components/admin/inventory/ItemManagement";
import StockMovement from "@/components/admin/inventory/StockMovement";
import PurchaseOrders from "@/components/admin/inventory/PurchaseOrders";
import RequestOrders from "@/components/admin/inventory/RequestOrders";
import AdminApproval from "@/components/admin/inventory/AdminApproval";
import CostAnalytics from "@/components/admin/inventory/CostAnalytics";
import InventorySettings from "@/components/admin/inventory/InventorySettings";
import BranchManagerInfo from "@/components/admin/BranchManagerInfo";
import { useAdminRole, useBranchMap } from "@/lib/admin-utils";

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
const mockBranches = [
  "Sanbry Main Branch",
  "Sanbry Makati",
  "Sanbry BGC",
  "Sanbry Ortigas",
  "Sanbry Alabang"
];
const mockUsers = ["Admin User", "Manager Sarah", "Barber John", "Barber Mike"];

const InventoryPage = () => {
  const { user, isLoading } = useAdminRole();
  const { getBranchName, branchMap } = useBranchMap();
  const userRole = user?.role;
  const isAdmin = userRole === "ADMIN";
  const isManager = userRole === "MANAGER";

  // Stable role state to prevent UI flickering during session refresh
  const [stableRole, setStableRole] = useState<string | null>(null);
  const [stableIsAdmin, setStableIsAdmin] = useState(false);
  const [stableIsManager, setStableIsManager] = useState(false);

  // Update stable role only when we have a definitive role (not during loading)
  useEffect(() => {
    if (!isLoading && userRole) {
      setStableRole(userRole);
      setStableIsAdmin(userRole === "ADMIN");
      setStableIsManager(userRole === "MANAGER");
      console.log("Stable role updated:", userRole);
    }
  }, [userRole, isLoading]);

  // Debug logging
  console.log("User:", user);
  console.log("User Role:", userRole);
  console.log("Is Loading:", isLoading);
  console.log("Is Admin:", isAdmin);
  console.log("Is Manager:", isManager);
  console.log("Stable Role:", stableRole);
  console.log("Stable Is Admin:", stableIsAdmin);
  console.log("Stable Is Manager:", stableIsManager);

  // Monitor role changes
  useEffect(() => {
    console.log("Role changed - User:", user?.fullName || user?.email, "Role:", userRole);
  }, [userRole, user]);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [stockTransactions, setStockTransactions] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [itemRequests, setItemRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Branch filter state
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  // Settings state
  const [categories, setCategories] = useState<string[]>(mockCategories);
  const [suppliers, setSuppliers] = useState<string[]>(mockSuppliers);
  const [branches, setBranches] = useState<string[]>([]);

  // Helper function to calculate correct status based on quantity and reorder threshold
  const calculateItemStatus = (quantity: number, reorderThreshold: number) => {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= reorderThreshold) return 'low-stock';
    return 'in-stock';
  };

  // Fetch data from APIs
  useEffect(() => {
    fetchInventoryItems();
    fetchStockTransactions();
    fetchPurchaseOrders();
    fetchItemRequests();
    fetchBranches();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory/items');
      if (response.ok) {
        const data = await response.json();

        // Recalculate status based on current quantity and reorder threshold
        const itemsWithCorrectStatus = data.map((item: any) => ({
          ...item,
          status: calculateItemStatus(item.quantity, item.reorderThreshold)
        }));

        setInventoryItems(itemsWithCorrectStatus);
        console.log(`Loaded ${data.length} inventory items from database`);
      } else {
        console.error('Failed to fetch inventory items');
        toast.error('Failed to load inventory items');
        // Fallback to mock data if database fails
        setInventoryItems(mockInventoryItems);
      }
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      toast.error('Error loading inventory items');
      // Fallback to mock data if API fails
      setInventoryItems(mockInventoryItems);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory/stock-transactions');
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setStockTransactions(data);
          console.log(`Loaded ${data.length} stock transactions from database`);
        } else {
          console.log('No stock transactions found in database, using mock data');
          // Use mock data formatted to match the expected interface
          const mockTransactionData = [
            {
              id: "1",
              itemId: "1",
              itemName: "Professional Hair Clippers",
              type: "in",
              quantity: 10,
              previousQuantity: 5,
              newQuantity: 15,
              user: "Admin User",
              userId: "admin-id",
              notes: "Restock from supplier",
              reason: "Restock",
              branch: "Main Branch",
              timestamp: "2024-01-15T10:30:00Z",
            },
            {
              id: "2",
              itemId: "2",
              itemName: "Hair Shampoo",
              type: "out",
              quantity: 5,
              previousQuantity: 13,
              newQuantity: 8,
              user: "Barber John",
              userId: "barber-id",
              notes: "Used during haircut service",
              reason: "Used during service",
              branch: "Main Branch",
              timestamp: "2024-01-15T09:15:00Z",
            },
            {
              id: "3",
              itemId: "3",
              itemName: "Styling Gel",
              type: "in",
              quantity: 20,
              previousQuantity: 0,
              newQuantity: 20,
              user: "Manager Sarah",
              userId: "manager-id",
              notes: "Emergency restock",
              reason: "Emergency Restock",
              branch: "Main Branch",
              timestamp: "2024-01-15T08:45:00Z",
            }
          ];
          setStockTransactions(mockTransactionData);
        }
      } else {
        console.error('Failed to fetch stock transactions');
        toast.error('Failed to load stock transactions');
        // Fallback to mock data if API fails
        setStockTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching stock transactions:', error);
      toast.error('Error loading stock transactions');
      // Fallback to mock data if API fails
      setStockTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory/purchase-orders');
      if (response.ok) {
        const data = await response.json();
        setPurchaseOrders(data);
        console.log(`Loaded ${data.length} purchase orders from database`);
      } else {
        console.error('Failed to fetch purchase orders');
        toast.error('Failed to load purchase orders');
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast.error('Error loading purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/inventory/branches');
      if (response.ok) {
        const data = await response.json();
        // Extract branch names from the API response
        const branchNames = data.map((branch: any) => branch.name);
        setBranches(branchNames);
        console.log(`Loaded ${branchNames.length} branches from database`);
      } else {
        console.error('Failed to fetch branches');
        // Fallback to mock branches if API fails
        setBranches(mockBranches);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      // Fallback to mock branches if API fails
      setBranches(mockBranches);
    }
  };

  const fetchItemRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory/item-requests');
      if (response.ok) {
        const data = await response.json();
        setItemRequests(data);
        console.log(`Loaded ${data.length} item requests from database`);
      } else {
        console.error('Failed to fetch item requests');
        toast.error('Failed to load item requests');
      }
    } catch (error) {
      console.error('Error fetching item requests:', error);
      toast.error('Error loading item requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (item: any) => {
    try {
      console.log('Received item data in handleAddItem:', item);
      console.log('Branch value being sent to API:', item.branch);

      const response = await fetch('/api/inventory/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...item,
          // Use the branch selected by the user in the form
        }),
      });

      if (response.ok) {
        const newItem = await response.json();
        toast.success("Item added successfully");

        // Recalculate status for the new item
        const itemWithCorrectStatus = {
          ...newItem,
          status: calculateItemStatus(newItem.quantity, newItem.reorderThreshold)
        };

        // Add to local state with correct status
        setInventoryItems([...inventoryItems, itemWithCorrectStatus]);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add item");
      }
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error("Error adding item");
    }
  };

  const handleUpdateItem = async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/inventory/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        toast.success("Item updated successfully");

        // Recalculate status for the updated item
        const itemWithCorrectStatus = {
          ...updatedItem,
          status: calculateItemStatus(updatedItem.quantity, updatedItem.reorderThreshold)
        };

        // Update local state with the corrected status
        setInventoryItems(inventoryItems.map(item =>
          item.id === id ? itemWithCorrectStatus : item
        ));
      } else {
        const error = await response.json();
        console.error('Update failed with error:', error);
        toast.error(error.error || "Failed to update item");
        // Log the detailed error information for debugging
        if (error.missingFields) {
          console.error('Missing fields:', error.missingFields);
          console.error('Field values:', error.fieldValues);
        }
      }
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error("Error updating item");
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/inventory/items/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Item deleted successfully");

        // Remove from local state
        setInventoryItems(inventoryItems.filter(item => item.id !== id));
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete item");
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error("Error deleting item");
    }
  };

  const handleAddTransaction = async (transaction: any) => {
    try {
      const response = await fetch('/api/inventory/stock-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...transaction,
          userId: 'admin-user-id', // TODO: Get from session
          branch: 'Main Branch', // TODO: Get from user context
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Transaction recorded successfully");

        // Refresh both transactions and items list to get updated quantities
        fetchStockTransactions();
        fetchInventoryItems();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to record transaction");
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error("Error recording transaction");
    }
  };

  const handleCreateOrder = async (order: any) => {
    try {
      const response = await fetch('/api/inventory/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...order,
          requestedBy: 'admin-user-id', // TODO: Get from session
          branch: order.branch, // Use the branch selected by the user
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Purchase order created successfully");

        // Refresh the purchase orders list
        fetchPurchaseOrders();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create purchase order");
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast.error("Error creating purchase order");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: any) => {
    try {
      const response = await fetch(`/api/inventory/purchase-orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Order status updated to ${status}`);

        // Update local state with the updated order
        setPurchaseOrders(purchaseOrders.map((order: any) =>
          order.id === orderId
            ? {
              ...order,
              status: result.order.status,
              orderedDate: result.order.orderedDate,
              receivedDate: result.order.receivedDate,
            }
            : order
        ));

        // If order was marked as received, refresh inventory and transactions
        if (status === 'received') {
          toast.success('Inventory updated with received items');
          // Refresh inventory items and stock transactions
          fetchInventoryItems();
          fetchStockTransactions();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update order status");
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error("Error updating order status");
    }
  };

  // Settings handlers
  const handleUpdateCategories = (newCategories: string[]) => {
    setCategories(newCategories);
  };

  const handleUpdateSuppliers = (newSuppliers: string[]) => {
    setSuppliers(newSuppliers);
  };

  const handleCreateRequest = async (request: any) => {
    try {
      console.log('Creating request with data:', request);
      const requestData = {
        ...request,
        requestedBy: user?.name || user?.email || 'Manager',
      };
      console.log('Final request data:', requestData);

      const response = await fetch('/api/inventory/item-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Request created successfully:', result);
        toast.success("Request submitted successfully");

        // Refresh the requests list
        fetchItemRequests();
      } else {
        const error = await response.json();
        console.error('Request creation failed:', error);
        toast.error(error.error || "Failed to create request");
      }
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error("Error creating request");
    }
  };

  const handleApproveRequest = async (requestId: string, notes?: string) => {
    try {
      console.log('Approving request:', requestId);
      const response = await fetch(`/api/inventory/item-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          reviewedBy: user?.name || user?.email || 'Admin',
          notes,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Approval result:', result);
        toast.success("Request approved successfully - Stock updated");

        // Refresh all related data since stock was updated
        console.log('Refreshing data after approval...');
        await Promise.all([
          fetchItemRequests(),
          fetchPurchaseOrders(),
          fetchInventoryItems(),
          fetchStockTransactions()
        ]);
        console.log('Data refresh completed');
      } else {
        const error = await response.json();
        console.error('Approval failed:', error);
        toast.error(error.error || "Failed to approve request");
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error("Error approving request");
    }
  };

  const handleRejectRequest = async (requestId: string, reason: string) => {
    try {
      const response = await fetch(`/api/inventory/item-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          reviewedBy: user?.name || user?.email || 'Admin',
          rejectionReason: reason,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Request rejected");

        // Refresh the requests list
        fetchItemRequests();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to reject request");
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error("Error rejecting request");
    }
  };

  const lowStockItems = inventoryItems
    .filter(item => item.quantity <= item.reorderThreshold)
    .map(item => ({
      id: item.id,
      name: item.name,
      currentQuantity: item.quantity,
      reorderThreshold: item.reorderThreshold,
      supplier: item.supplier,
      branch: item.branch,
      unitPrice: parseFloat(item.unitPrice || '0'),
    }));

  const handleBranchChange = (branches: string[]) => {
    // Only allow branch changes for non-managers
    if (!stableIsManager) {
      setSelectedBranches(branches);
    }
  };

  // Helper functions to provide appropriate props based on user role
  const getBranchFilterProps = () => {
    if (stableIsManager) {
      // Managers don't need branch filters - they're auto-filtered
      return {
        selectedBranches: [],
        onBranchChange: () => {}, // No-op function
      };
    }
    // Admins get full branch filtering functionality
    return {
      selectedBranches,
      onBranchChange: handleBranchChange,
    };
  };

  // Filter data based on selected branches and user role
  const getFilteredData = () => {
    let baseItems = inventoryItems;
    let baseTransactions = stockTransactions;
    let baseOrders = purchaseOrders;

    // For managers, automatically filter by their branch
    if (stableIsManager && user?.branch) {
      // user.branch could be ID or name, so we need to handle both cases
      const userBranchName = getBranchName(user.branch);
      baseItems = inventoryItems.filter(item => 
        item.branch === user.branch || getBranchName(item.branch) === userBranchName
      );
      baseTransactions = stockTransactions.filter(transaction => 
        transaction.branch === user.branch || getBranchName(transaction.branch) === userBranchName
      );
      baseOrders = purchaseOrders.filter(order => 
        order.branch === user.branch || getBranchName(order.branch) === userBranchName
      );
    }

    // Apply additional branch filters if any are selected (for admins)
    if (selectedBranches.length > 0 && !stableIsManager) {
      return {
        filteredItems: baseItems.filter(item => 
          selectedBranches.includes(item.branch) || selectedBranches.includes(getBranchName(item.branch))
        ),
        filteredTransactions: baseTransactions.filter(transaction =>
          transaction.branch && (
            selectedBranches.includes(transaction.branch) || 
            selectedBranches.includes(getBranchName(transaction.branch))
          )
        ),
        filteredOrders: baseOrders.filter(order => 
          selectedBranches.includes(order.branch) || selectedBranches.includes(getBranchName(order.branch))
        ),
      };
    }

    return {
      filteredItems: baseItems,
      filteredTransactions: baseTransactions,
      filteredOrders: baseOrders,
    };
  };

  // Calculate real inventory statistics from filtered data
  const calculateRealStats = () => {
    const { filteredItems, filteredTransactions, filteredOrders } = getFilteredData();

    const totalItems = filteredItems.length;
    const lowStockCount = filteredItems.filter(item => item.quantity <= item.reorderThreshold).length;
    const outOfStockCount = filteredItems.filter(item => item.quantity === 0).length;
    const totalValue = filteredItems.reduce((sum, item) => sum + (item.quantity * parseFloat(item.unitPrice || '0')), 0);
    const recentTransactionsCount = filteredTransactions.length;
    const pendingOrdersCount = filteredOrders.filter(order => order.status === 'requested' || order.status === 'ordered').length;

    return {
      totalItems,
      lowStockItems: lowStockCount,
      outOfStockItems: outOfStockCount,
      expiringSoonItems: 0, // TODO: Calculate based on expiration dates
      totalValue: Math.round(totalValue),
      recentTransactions: recentTransactionsCount,
      pendingOrders: pendingOrdersCount,
      activeSuppliers: [...new Set(filteredItems.map(item => item.supplier))].length,
    };
  };

  // Build unified recent activity from filtered data
  const getRealRecentActivity = () => {
    const { filteredItems, filteredTransactions, filteredOrders } = getFilteredData();

    // Stock movements
    const stockActivity = (filteredTransactions || []).map((t: any) => ({
      id: `tx-${t.id}`,
      action: t.type === 'in' ? 'Stock In' : 'Stock Out',
      item: t.itemName || 'Unknown Item',
      quantity: t.quantity,
      user: t.user || 'Unknown User',
      timestamp: t.timestamp,
      type: t.type as 'in' | 'out',
    }));

    // Item updates (use updatedAt when available)
    const itemActivity = (filteredItems || [])
      .filter((it: any) => it.updatedAt || it.createdAt)
      .map((it: any) => ({
        id: `item-${it.id}`,
        action: (it.createdAt && it.updatedAt && it.createdAt === it.updatedAt) ? 'Item Added' : 'Item Updated',
        item: it.name,
        quantity: it.quantity ?? 0,
        user: 'System',
        timestamp: (it.updatedAt || it.createdAt),
        type: 'update' as const,
      }));

    // Purchase order lifecycle events
    const poActivity = (filteredOrders || []).flatMap((po: any) => {
      const totalUnits = (po.items || []).reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
      const requested: any[] = po.requestedDate ? [{
        id: `po-req-${po.id}`,
        action: 'PO Requested',
        item: po.orderNumber || po.supplier || 'Purchase Order',
        quantity: totalUnits,
        user: po.requestedBy || 'User',
        timestamp: po.requestedDate,
        type: 'update' as const,
      }] : [];
      const ordered: any[] = po.orderedDate ? [{
        id: `po-ord-${po.id}`,
        action: 'PO Ordered',
        item: po.orderNumber || po.supplier || 'Purchase Order',
        quantity: totalUnits,
        user: po.requestedBy || 'User',
        timestamp: po.orderedDate,
        type: 'update' as const,
      }] : [];
      const received: any[] = po.receivedDate ? [{
        id: `po-rcv-${po.id}`,
        action: 'PO Received',
        item: po.orderNumber || po.supplier || 'Purchase Order',
        quantity: totalUnits,
        user: po.requestedBy || 'User',
        timestamp: po.receivedDate,
        type: 'in' as const,
      }] : [];
      // If cancelled, use updatedAt as a fallback timestamp
      const cancelled: any[] = (po.status === 'cancelled') ? [{
        id: `po-cancel-${po.id}`,
        action: 'PO Cancelled',
        item: po.orderNumber || po.supplier || 'Purchase Order',
        quantity: totalUnits,
        user: po.requestedBy || 'User',
        timestamp: po.updatedAt || po.requestedDate || new Date().toISOString(),
        type: 'delete' as const,
      }] : [];
      return [...requested, ...ordered, ...received, ...cancelled];
    });

    // Merge, sort by time desc, take latest 10
    const merged = [...stockActivity, ...itemActivity, ...poActivity]
      .filter(a => !!a.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return merged;
  };

  const realStats = calculateRealStats();
  const realRecentActivity = getRealRecentActivity();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
        <p className="text-gray-600">Manage your barbershop inventory, track stock movements, and handle purchase orders</p>
      </div>

      <BranchManagerInfo />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${stableIsAdmin ? 'grid-cols-7' : 'grid-cols-6'}`}>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Items
          </TabsTrigger>
          <TabsTrigger value="movement" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Stock Movement
          </TabsTrigger>
          {/* Admin sees Purchase Orders and Approvals */}
          {stableIsAdmin && (
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Purchase Orders
            </TabsTrigger>
          )}
          {/* Manager sees Request Orders */}
          {(stableIsManager || !stableIsAdmin) && (
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Request Orders
            </TabsTrigger>
          )}
          {/* Admin sees Approvals tab */}
          {stableIsAdmin && (
            <TabsTrigger value="approvals" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approvals
            </TabsTrigger>
          )}
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <InventoryDashboard
            stats={realStats}
            recentActivity={realRecentActivity}
            branches={branches}
            {...getBranchFilterProps()}
          />
        </TabsContent>

        <TabsContent value="items" className="space-y-6">
          <ItemManagement
            items={inventoryItems}
            categories={categories}
            suppliers={suppliers}
            branches={branches}
            {...getBranchFilterProps()}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
          />
        </TabsContent>

        <TabsContent value="movement" className="space-y-6">
          <StockMovement
            transactions={getFilteredData().filteredTransactions}
            items={getFilteredData().filteredItems.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, branch: item.branch }))}
            users={mockUsers}
            branches={branches}
            {...getBranchFilterProps()}
            onAddTransaction={handleAddTransaction}
          />
        </TabsContent>

        {/* Purchase Orders - Only for Admins */}
        {stableIsAdmin && (
          <TabsContent value="orders" className="space-y-6">
            <PurchaseOrders
              orders={purchaseOrders}
              suppliers={suppliers}
              branches={branches}
              {...getBranchFilterProps()}
              lowStockItems={lowStockItems}
              users={mockUsers}
              onCreateOrder={handleCreateOrder}
              onUpdateOrderStatus={async (orderId: string, status: any) => {
                await handleUpdateOrderStatus(orderId, status);
              }}
            />
          </TabsContent>
        )}

        {/* Request Orders - Only for Managers */}
        {(stableIsManager || !stableIsAdmin) && (
          <TabsContent value="requests" className="space-y-6">
            <RequestOrders
              requests={itemRequests}
              suppliers={suppliers}
              branches={branches}
              {...getBranchFilterProps()}
              lowStockItems={getFilteredData().filteredItems
                .filter(item => item.quantity <= item.reorderThreshold)
                .map(item => ({
                  id: item.id,
                  name: item.name,
                  currentQuantity: item.quantity,
                  reorderThreshold: item.reorderThreshold,
                  supplier: item.supplier,
                  branch: item.branch,
                  unitPrice: parseFloat(item.unitPrice || '0'),
                }))}
              onCreateRequest={handleCreateRequest}
            />
          </TabsContent>
        )}

        {/* Approvals - Only for Admins */}
        {stableIsAdmin && (
          <TabsContent value="approvals" className="space-y-6">
            <AdminApproval
              requests={itemRequests}
              branches={branches}
              {...getBranchFilterProps()}
              onApproveRequest={handleApproveRequest}
              onRejectRequest={handleRejectRequest}
            />
          </TabsContent>
        )}

        <TabsContent value="analytics" className="space-y-6">
          <CostAnalytics
            branches={branches}
            {...getBranchFilterProps()}
            inventoryItems={inventoryItems}
            stockTransactions={stockTransactions}
            purchaseOrders={purchaseOrders}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <InventorySettings
            categories={categories}
            suppliers={suppliers}
            users={mockUsers}
            onUpdateCategories={handleUpdateCategories}
            onUpdateSuppliers={handleUpdateSuppliers}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryPage;