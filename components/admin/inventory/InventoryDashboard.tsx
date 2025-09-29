import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BranchFilter from "./BranchFilter";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
  Activity,
  Coins,
  Users,
  ShoppingCart
} from "lucide-react";

interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringSoonItems: number;
  totalValue: number;
  recentTransactions: number;
  pendingOrders: number;
  activeSuppliers: number;
}

interface RecentActivity {
  id: string;
  action: string;
  item: string;
  quantity: number;
  user: string;
  timestamp: string;
  type: 'in' | 'out' | 'update' | 'delete';
}

interface InventoryDashboardProps {
  stats: InventoryStats;
  recentActivity: RecentActivity[];
  branches: string[];
  selectedBranches: string[];
  onBranchChange: (branches: string[]) => void;
}

const InventoryDashboard = ({
  stats,
  recentActivity,
  branches,
  selectedBranches,
  onBranchChange
}: InventoryDashboardProps) => {
  const getActionColor = (type: string) => {
    switch (type) {
      case 'in': return 'bg-green-100 text-green-800';
      case 'out': return 'bg-red-100 text-red-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'in': return '📥';
      case 'out': return '📤';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      default: return '📋';
    }
  };

  return (
    <div className="space-y-6">
      {/* Branch Filter */}
      <BranchFilter
        branches={branches}
        selectedBranches={selectedBranches}
        onBranchChange={onBranchChange}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Needs restocking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Immediate attention needed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Coins className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₱{stats.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Current inventory value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.expiringSoonItems}</div>
            <p className="text-xs text-muted-foreground">
              Items expiring in 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.activeSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              Current suppliers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getActionIcon(activity.type)}</span>
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-gray-600">
                        {activity.item} - {activity.quantity} units
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getActionColor(activity.type)}>
                      {activity.type.toUpperCase()}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.user} • {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium mb-2">No Recent Activity</p>
                <p className="text-sm">
                  Stock transactions will appear here once you start recording inventory movements.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryDashboard;