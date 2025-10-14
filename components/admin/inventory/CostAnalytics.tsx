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
import { useAdminRole } from "@/lib/admin-utils";
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
    Cell,
    AreaChart,
    Area
} from "recharts";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package,
    BarChart3,
    Download
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
    averageTransactionValue: number;
    category?: string;
    supplier?: string;
    itemCount?: number;
    efficiency?: number;
}

interface CategoryData {
    category: string;
    totalCost: number;
    itemCount: number;
    avgCost: number;
}

interface SupplierData {
    supplier: string;
    totalOrders: number;
    totalValue: number;
    avgOrderValue: number;
}

interface BranchPerformance {
    branch: string;
    efficiency: number;
    turnover: number;
    costRatio: number;
    transactions: number;
}

const CostAnalytics = ({
    branches,
    selectedBranches,
    onBranchChange,
    inventoryItems,
    stockTransactions,
    purchaseOrders
}: CostAnalyticsProps) => {
    const { userRole } = useAdminRole();
    const isManager = userRole === "MANAGER";

    // Simple state management
    const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "quarterly" | "yearly">("monthly");

    const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
    const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
    const [supplierData, setSupplierData] = useState<SupplierData[]>([]);
    const [branchPerformance, setBranchPerformance] = useState<BranchPerformance[]>([]);
    const [loading, setLoading] = useState(false);

    // Colors for charts
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

    useEffect(() => {
        calculateAnalytics();
        calculateCategoryAnalytics();
        calculateSupplierAnalytics();
        calculateBranchPerformance();
    }, [period, selectedBranches, inventoryItems, stockTransactions, purchaseOrders]);

    const calculateAnalytics = () => {
        setLoading(true);

        // Filter transactions based on selected branches
        const filteredTransactions = stockTransactions.filter(transaction => {
            return selectedBranches.length === 0 ||
                (transaction.branch && selectedBranches.includes(transaction.branch));
        });

        // Group data by time period
        const groupedData: { [key: string]: AnalyticsData } = {};

        filteredTransactions.forEach(transaction => {
            const date = new Date(transaction.timestamp || transaction.createdAt);
            const item = inventoryItems.find(item => item.id === transaction.itemId);

            const groupKey = getPeriodKey(date, period);

            if (!groupedData[groupKey]) {
                groupedData[groupKey] = {
                    period: groupKey,
                    branch: transaction.branch || 'Unknown',
                    branchName: transaction.branch || 'Unknown',
                    costIn: 0,
                    costOut: 0,
                    netCost: 0,
                    transactionCount: 0,
                    averageTransactionValue: 0
                };
            }

            const unitPrice = item ? parseFloat(item.unitPrice || '0') : 0;
            const cost = transaction.quantity * unitPrice;

            if (transaction.type === 'in') {
                groupedData[groupKey].costIn += cost;
            } else {
                groupedData[groupKey].costOut += cost;
            }

            groupedData[groupKey].transactionCount += 1;
        });

        // Calculate derived metrics
        Object.values(groupedData).forEach(data => {
            data.netCost = data.costIn - data.costOut;
            data.averageTransactionValue = data.transactionCount > 0 ?
                (data.costIn + data.costOut) / data.transactionCount : 0;
        });

        setAnalyticsData(Object.values(groupedData).sort((a, b) => a.period.localeCompare(b.period)));
        setLoading(false);
    };

    const calculateCategoryAnalytics = () => {
        const categoryMap: { [key: string]: CategoryData } = {};

        inventoryItems.forEach(item => {
            if (selectedBranches.length === 0 || selectedBranches.includes(item.branch)) {
                const category = item.category || 'Unknown';
                const cost = parseFloat(item.unitPrice || '0') * item.quantity;

                if (!categoryMap[category]) {
                    categoryMap[category] = {
                        category,
                        totalCost: 0,
                        itemCount: 0,
                        avgCost: 0
                    };
                }

                categoryMap[category].totalCost += cost;
                categoryMap[category].itemCount += 1;
            }
        });

        // Calculate average costs
        Object.values(categoryMap).forEach(cat => {
            cat.avgCost = cat.itemCount > 0 ? cat.totalCost / cat.itemCount : 0;
        });

        setCategoryData(Object.values(categoryMap).sort((a, b) => b.totalCost - a.totalCost));
    };

    const calculateSupplierAnalytics = () => {
        const supplierMap: { [key: string]: SupplierData } = {};

        purchaseOrders.forEach(order => {
            if (selectedBranches.length === 0 || selectedBranches.includes(order.branch)) {
                const supplier = order.supplier || 'Unknown';
                const value = parseFloat(order.totalAmount || '0');

                if (!supplierMap[supplier]) {
                    supplierMap[supplier] = {
                        supplier,
                        totalOrders: 0,
                        totalValue: 0,
                        avgOrderValue: 0
                    };
                }

                supplierMap[supplier].totalOrders += 1;
                supplierMap[supplier].totalValue += value;
            }
        });

        // Calculate average order values
        Object.values(supplierMap).forEach(sup => {
            sup.avgOrderValue = sup.totalOrders > 0 ? sup.totalValue / sup.totalOrders : 0;
        });

        setSupplierData(Object.values(supplierMap).sort((a, b) => b.totalValue - a.totalValue));
    };

    const calculateBranchPerformance = () => {
        const branchMap: { [key: string]: BranchPerformance } = {};

        // Initialize with all branches
        branches.forEach(branch => {
            if (selectedBranches.length === 0 || selectedBranches.includes(branch)) {
                branchMap[branch] = {
                    branch,
                    efficiency: 0,
                    turnover: 0,
                    costRatio: 0,
                    transactions: 0
                };
            }
        });

        // Calculate metrics from transactions
        stockTransactions.forEach(transaction => {
            const branch = transaction.branch || 'Unknown';
            if (branchMap[branch]) {
                branchMap[branch].transactions += 1;

                const item = inventoryItems.find(item => item.id === transaction.itemId);
                const cost = item ? parseFloat(item.unitPrice || '0') * transaction.quantity : 0;

                if (transaction.type === 'in') {
                    branchMap[branch].costRatio += cost;
                } else {
                    branchMap[branch].turnover += cost;
                }
            }
        });

        // Calculate efficiency and ratios
        Object.values(branchMap).forEach(branch => {
            branch.efficiency = branch.transactions > 0 ? branch.turnover / branch.transactions : 0;
            branch.costRatio = branch.costRatio > 0 ? (branch.turnover / branch.costRatio) * 100 : 0;
        });

        setBranchPerformance(Object.values(branchMap).sort((a, b) => b.efficiency - a.efficiency));
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
            case 'quarterly':
                const quarter = Math.floor(date.getMonth() / 3) + 1;
                return `${date.getFullYear()}-Q${quarter}`;
            case 'yearly':
                return `${date.getFullYear()}`;
            default:
                return date.toISOString().split('T')[0];
        }
    };

    const exportData = () => {
        const csvContent = [
            ["Period", "Branch", "Cost In", "Cost Out", "Net Cost", "Transactions", "Avg Value"].join(","),
            ...analyticsData.map(item => [
                item.period,
                item.branchName,
                item.costIn,
                item.costOut,
                item.netCost,
                item.transactionCount,
                item.averageTransactionValue
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const renderChart = () => {
        const chartData = analyticsData;

        return (
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `₱${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="costIn" stroke="#10B981" name="Cost In" strokeWidth={2} />
                    <Line type="monotone" dataKey="costOut" stroke="#EF4444" name="Cost Out" strokeWidth={2} />
                    <Line type="monotone" dataKey="netCost" stroke="#3B82F6" name="Net Cost" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        );
    };

    // Calculate summary statistics
    const totalCostIn = analyticsData.reduce((sum, item) => sum + item.costIn, 0);
    const totalCostOut = analyticsData.reduce((sum, item) => sum + item.costOut, 0);
    const totalNetCost = totalCostIn - totalCostOut;
    const totalTransactions = analyticsData.reduce((sum, item) => sum + item.transactionCount, 0);

    return (
        <div className="space-y-6">
            {/* Branch Filter - Hidden for managers */}
            {!isManager && (
                <BranchFilter
                    branches={branches}
                    selectedBranches={selectedBranches}
                    onBranchChange={onBranchChange}
                />
            )}

            {/* Simple Controls */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Inventory Analytics</CardTitle>
                        <div className="flex items-center gap-2">
                            <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>



                            <Button variant="outline" size="sm" onClick={exportData}>
                                <Download className="h-4 w-4" />
                                Export
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

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

            {/* Additional Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">


                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
                        <DollarSign className="h-4 w-4 text-cyan-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-cyan-600">
                            ₱{(analyticsData.reduce((sum, item) => sum + item.averageTransactionValue, 0) / Math.max(analyticsData.length, 1)).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Average per transaction
                        </p>
                    </CardContent>
                </Card>

            </div>

            {/* Main Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Cost Analytics - {period.charAt(0).toUpperCase() + period.slice(1)} Trend
                        {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {renderChart()}
                </CardContent>
            </Card>

            {/* Additional Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Analysis */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            📂 Category Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={categoryData.slice(0, 8)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="category"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis />
                                <Tooltip formatter={(value: any) => `₱${Number(value).toLocaleString()}`} />
                                <Bar dataKey="totalCost" fill="#8884d8" name="Total Cost" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Supplier Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            🏭 Supplier Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={supplierData.slice(0, 6).map((item, index) => ({
                                        name: item.supplier.length > 15 ? item.supplier.substring(0, 15) + '...' : item.supplier,
                                        value: item.totalValue,
                                        fill: COLORS[index % COLORS.length]
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ₱${(Number(value) / 1000).toFixed(0)}k`}
                                >
                                    {supplierData.slice(0, 6).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => `₱${Number(value).toLocaleString()}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Monthly Spending Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            📊 Monthly Spending Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analyticsData.filter(item => item.period.includes('-'))}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="period" />
                                <YAxis tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value: any) => `₱${Number(value).toLocaleString()}`} />
                                <Line
                                    type="monotone"
                                    dataKey="costIn"
                                    stroke="#10B981"
                                    strokeWidth={3}
                                    name="Monthly Cost In"
                                    dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="costOut"
                                    stroke="#EF4444"
                                    strokeWidth={3}
                                    name="Monthly Cost Out"
                                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 5 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="netCost"
                                    stroke="#3B82F6"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    name="Net Monthly Cost"
                                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                                />
                                <Legend />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Cost Distribution by Branch */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            🏢 Cost Distribution by Branch
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={(() => {
                                // Create branch cost data from stock transactions
                                const branchCosts: { [key: string]: { branch: string; costIn: number; costOut: number; netCost: number } } = {};

                                stockTransactions.forEach(transaction => {
                                    const branch = transaction.branch || 'Unknown';

                                    // Filter out generic branch names and only include actual Sanbry branches
                                    const validBranches = branches.filter(b =>
                                        b.includes('Sanbry') ||
                                        (b !== 'Main Branch' && b !== 'Unknown' && b !== 'Default')
                                    );

                                    if ((selectedBranches.length === 0 || selectedBranches.includes(branch)) &&
                                        (validBranches.includes(branch) || branch === 'Unknown')) {

                                        if (!branchCosts[branch]) {
                                            branchCosts[branch] = { branch, costIn: 0, costOut: 0, netCost: 0 };
                                        }

                                        const item = inventoryItems.find(item => item.id === transaction.itemId);
                                        const cost = item ? parseFloat(item.unitPrice || '0') * transaction.quantity : 0;

                                        if (transaction.type === 'in') {
                                            branchCosts[branch].costIn += cost;
                                        } else {
                                            branchCosts[branch].costOut += cost;
                                        }
                                        branchCosts[branch].netCost = branchCosts[branch].costIn - branchCosts[branch].costOut;
                                    }
                                });

                                return Object.values(branchCosts).sort((a, b) => b.costIn - a.costIn).slice(0, 8);
                            })()}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="branch"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value: any) => `₱${Number(value).toLocaleString()}`} />
                                <Bar dataKey="costIn" fill="#10B981" name="Cost In" />
                                <Bar dataKey="costOut" fill="#EF4444" name="Cost Out" />
                                <Legend />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Simple Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Analytics Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2">Period</th>
                                    <th className="text-right p-2">Cost In</th>
                                    <th className="text-right p-2">Cost Out</th>
                                    <th className="text-right p-2">Net Cost</th>
                                    <th className="text-right p-2">Transactions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analyticsData.map((item, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                        <td className="p-2 font-medium">{item.period}</td>
                                        <td className="p-2 text-right text-green-600">
                                            ₱{item.costIn.toLocaleString()}
                                        </td>
                                        <td className="p-2 text-right text-red-600">
                                            ₱{item.costOut.toLocaleString()}
                                        </td>
                                        <td className={`p-2 text-right font-medium ${item.netCost >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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