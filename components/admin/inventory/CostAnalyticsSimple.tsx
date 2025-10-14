import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    Cell,
    AreaChart,
    Area,
    ComposedChart
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
}

const CostAnalytics = ({
    branches,
    selectedBranches,
    onBranchChange,
    inventoryItems,
    stockTransactions,
    purchaseOrders
}: CostAnalyticsProps) => {
    // Simple state management
    const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "quarterly" | "yearly">("monthly");
    const [chartType, setChartType] = useState<"line" | "bar" | "area" | "pie" | "composed">("line");
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
    const [loading, setLoading] = useState(false);

    // Colors for charts
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

    useEffect(() => {
        calculateAnalytics();
    }, [period, chartType, selectedBranches, inventoryItems, stockTransactions, purchaseOrders]);

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

        switch (chartType) {
            case "line":
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

            case "bar":
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip formatter={(value: any) => `₱${Number(value).toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="costIn" fill="#10B981" name="Cost In" />
                            <Bar dataKey="costOut" fill="#EF4444" name="Cost Out" />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case "area":
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip formatter={(value: any) => `₱${Number(value).toLocaleString()}`} />
                            <Legend />
                            <Area type="monotone" dataKey="costIn" stackId="1" stroke="#10B981" fill="#10B981" name="Cost In" />
                            <Area type="monotone" dataKey="costOut" stackId="1" stroke="#EF4444" fill="#EF4444" name="Cost Out" />
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case "pie":
                const pieData = chartData.map((item, index) => ({
                    name: item.period,
                    value: item.costIn,
                    fill: COLORS[index % COLORS.length]
                }));

                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ₱${Number(value).toLocaleString()}`}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => `₱${Number(value).toLocaleString()}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case "composed":
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip formatter={(value: any) => `₱${Number(value).toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="costIn" fill="#10B981" name="Cost In" />
                            <Bar dataKey="costOut" fill="#EF4444" name="Cost Out" />
                            <Line type="monotone" dataKey="netCost" stroke="#3B82F6" name="Net Cost" strokeWidth={3} />
                        </ComposedChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

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

            {/* Simple Controls */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Cost Analytics</CardTitle>
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
                            
                            <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="line">📈 Line Chart</SelectItem>
                                    <SelectItem value="bar">📊 Bar Chart</SelectItem>
                                    <SelectItem value="area">🏔️ Area Chart</SelectItem>
                                    <SelectItem value="pie">🥧 Pie Chart</SelectItem>
                                    <SelectItem value="composed">📊📈 Combined</SelectItem>
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

            {/* Main Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Cost Analytics - {period.charAt(0).toUpperCase() + period.slice(1)} View
                        {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {renderChart()}
                </CardContent>
            </Card>

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