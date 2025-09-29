import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BranchFilter from "./BranchFilter";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Package,
  ShoppingCart,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";

interface CostAnalyticsProps {
  branches: string[];
  selectedBranches: string[];
  onBranchChange: (branches: string[]) => void;
  inventoryItems: any[];
  stockTransactions: any[];
  purchaseOrders: any[];
}

interface AnalyticsData {
  period: string;
  branch: string;
  branchName: string;
  costIn: number;
  costOut: number;
  netCost: number;
  transactionCount: number;
}

const CostAnalytics = ({
  branches,
  selectedBranches,
  onBranchChange,
  inventoryItems,
  stockTransactions,
  purchaseOrders
}: CostAnalyticsProps) => {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    calculateAnalytics();
  }, [period, selectedBranches, dateRange, inventoryItems, stockTransactions, purchaseOrders]);

  const calculateAnalytics = () => {
    setLoading(true);
    
    // Filter data based on selected branches and date range
    const filteredTransactions = stockTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.timestamp || transaction.createdAt);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      const isInDateRange = transactionDate >= startDate && transactionDate <= endDate;
      const isInSelectedBranches = selectedBranches.length === 0 || 
        (transaction.branch && selectedBranches.includes(transaction.branch));
      
      return isInDateRange && isInSelectedBranches;
    });

    const filteredOrders = purchaseOrders.filter(order => {
      const orderDate = new Date(order.requestedDate || order.createdAt);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      const isInDateRange = orderDate >= startDate && orderDate <= endDate;
      const isInSelectedBranches = selectedBranches.length === 0 || 
        selectedBranches.includes(order.branch);
      
      return isInDateRange && isInSelectedBranches;
    });

    // Group data by period and branch
    const groupedData: { [key: string]: AnalyticsData } = {};

    // Process stock transactions
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.timestamp || transaction.createdAt);
      const periodKey = getPeriodKey(date, period);
      const branch = transaction.branch || 'Unknown';
      const key = `${periodKey}-${branch}`;
      
      if (!groupedData[key]) {
        groupedData[key] = {
          period: periodKey,
          branch,
          branchName: branch,
          costIn: 0,
          costOut: 0,
          netCost: 0,
          transactionCount: 0
        };
      }

      // Find the item to get unit price
      const item = inventoryItems.find(item => item.id === transaction.itemId);
      const unitPrice = item ? parseFloat(item.unitPrice || '0') : 0;
      const cost = transaction.quantity * unitPrice;

      if (transaction.type === 'in') {
        groupedData[key].costIn += cost;
      } else {
        groupedData[key].costOut += cost;
      }
      
      groupedData[key].transactionCount += 1;
    });

    // Process purchase orders
    filteredOrders.forEach(order => {
      const date = new Date(order.requestedDate || order.createdAt);
      const periodKey = getPeriodKey(date, period);
      const branch = order.branch || 'Unknown';
      const key = `${periodKey}-${branch}`;
      
      if (!groupedData[key]) {
        groupedData[key] = {
          period: periodKey,
          branch,
          branchName: branch,
          costIn: 0,
          costOut: 0,
          netCost: 0,
          transactionCount: 0
        };
      }

      // Add purchase order cost as cost in (when received)
      if (order.status === 'received') {
        groupedData[key].costIn += order.totalAmount || 0;
      }
    });

    // Calculate net cost for each entry
    Object.values(groupedData).forEach(data => {
      data.netCost = data.costIn - data.costOut;
    });

    setAnalyticsData(Object.values(groupedData).sort((a, b) => a.period.localeCompare(b.period)));
    setLoading(false);
  };

  const getPeriodKey = (date: Date, period: string): string => {
    switch (period) {
      case 'daily':
        return date.toISOString().split('T')[0];
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `Week of ${weekStart.toISOString().split('T')[0]}`;
      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  };

  // Prepare chart data
  const chartData = analyticsData.reduce((acc, item) => {
    const existing = acc.find(d => d.period === item.period);
    if (existing) {
      existing.costIn += item.costIn;
      existing.costOut += item.costOut;
      existing.netCost += item.netCost;
    } else {
      acc.push({
        period: item.period,
        costIn: item.costIn,
        costOut: item.costOut,
        netCost: item.netCost
      });
    }
    return acc;
  }, [] as any[]);

  // Prepare branch comparison data
  const branchData = analyticsData.reduce((acc, item) => {
    const existing = acc.find(d => d.branch === item.branch);
    if (existing) {
      existing.costIn += item.costIn;
      existing.costOut += item.costOut;
      existing.netCost += item.netCost;
    } else {
      acc.push({
        branch: item.branchName,
        costIn: item.costIn,
        costOut: item.costOut,
        netCost: item.netCost
      });
    }
    return acc;
  }, [] as any[]);

  // Calculate summary statistics
  const totalCostIn = analyticsData.reduce((sum, item) => sum + item.costIn, 0);
  const totalCostOut = analyticsData.reduce((sum, item) => sum + item.costOut, 0);
  const totalNetCost = totalCostIn - totalCostOut;
  const totalTransactions = analyticsData.reduce((sum, item) => sum + item.transactionCount, 0);

  return (
    <div className="space-y-6">
      {/* Branch Filter */}
      <BranchFilter
        branches={branches}
        selectedBranches={selectedBranches}
        onBranchChange={onBranchChange}
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Period:</span>
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Date Range:</span>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-1 border rounded text-sm"
          />
          <span className="text-sm text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-1 border rounded text-sm"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost In</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₱{totalCostIn.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Inventory purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost Out</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₱{totalCostOut.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Inventory usage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cost</CardTitle>
            <DollarSign className={`h-4 w-4 ${totalNetCost >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalNetCost >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₱{totalNetCost.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Net inventory cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalTransactions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total movements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Cost Trend Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value: any) => `₱${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="costIn" stroke="#10B981" name="Cost In" />
                <Line type="monotone" dataKey="costOut" stroke="#EF4444" name="Cost Out" />
                <Line type="monotone" dataKey="netCost" stroke="#3B82F6" name="Net Cost" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Branch Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Branch Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={branchData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch" />
                <YAxis />
                <Tooltip formatter={(value: any) => `₱${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="costIn" fill="#10B981" name="Cost In" />
                <Bar dataKey="costOut" fill="#EF4444" name="Cost Out" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Cost Distribution by Branch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={branchData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ branch, costIn }) => `${branch}: ₱${costIn.toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="costIn"
                >
                  {branchData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `₱${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Spending Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Spending Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value: any) => `₱${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="netCost" fill="#3B82F6" name="Net Spending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Period</th>
                  <th className="text-left p-2">Branch</th>
                  <th className="text-right p-2">Cost In</th>
                  <th className="text-right p-2">Cost Out</th>
                  <th className="text-right p-2">Net Cost</th>
                  <th className="text-right p-2">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2">{item.period}</td>
                    <td className="p-2">
                      <Badge variant="outline">{item.branchName}</Badge>
                    </td>
                    <td className="p-2 text-right text-green-600">
                      ₱{item.costIn.toLocaleString()}
                    </td>
                    <td className="p-2 text-right text-red-600">
                      ₱{item.costOut.toLocaleString()}
                    </td>
                    <td className={`p-2 text-right font-medium ${
                      item.netCost >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₱{item.netCost.toLocaleString()}
                    </td>
                    <td className="p-2 text-right">{item.transactionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CostAnalytics;