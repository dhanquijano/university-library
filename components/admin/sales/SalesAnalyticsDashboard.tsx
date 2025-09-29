import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Users,
  Calendar,
  CreditCard,
  Target,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from "lucide-react";
import dayjs from "dayjs";

interface SalesRecord {
  id: string;
  date: string;
  time?: string;
  branch: string;
  barber: string;
  services: string;
  gross: number;
  discount: number;
  net: number;
  paymentMethod: string;
  status: string;
  isManual?: boolean;
  verificationStatus?: "pending" | "verified" | "rejected";
}

interface SalesAnalyticsDashboardProps {
  sales: SalesRecord[];
  filtered: SalesRecord[];
  totals: {
    gross: number;
    discount: number;
    net: number;
  };
  startDate: string;
  endDate: string;
}

const SalesAnalyticsDashboard = ({
  sales,
  filtered,
  totals,
  startDate,
  endDate
}: SalesAnalyticsDashboardProps) => {
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Calculate key metrics
  const metrics = useMemo(() => {
    const totalTransactions = filtered.length;
    const averageTicket = totalTransactions > 0 ? totals.net / totalTransactions : 0;
    const completedTransactions = filtered.filter(s => s.status === 'completed').length;
    const completionRate = totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0;
    
    // Calculate growth compared to previous period
    const periodDays = dayjs(endDate).diff(dayjs(startDate), 'day') + 1;
    const previousStartDate = dayjs(startDate).subtract(periodDays, 'day').format('YYYY-MM-DD');
    const previousEndDate = dayjs(startDate).subtract(1, 'day').format('YYYY-MM-DD');
    
    const previousPeriodSales = sales.filter(s => {
      const saleDate = dayjs(s.date);
      return saleDate.isAfter(dayjs(previousStartDate).subtract(1, 'day')) && 
             saleDate.isBefore(dayjs(previousEndDate).add(1, 'day'));
    });
    
    const previousRevenue = previousPeriodSales.reduce((sum, s) => sum + s.net, 0);
    const revenueGrowth = previousRevenue > 0 ? ((totals.net - previousRevenue) / previousRevenue) * 100 : 0;
    
    return {
      totalTransactions,
      averageTicket,
      completionRate,
      revenueGrowth,
      previousRevenue
    };
  }, [filtered, totals, sales, startDate, endDate]);

  // Daily revenue trend
  const dailyTrend = useMemo(() => {
    const dailyData: { [key: string]: { date: string; revenue: number; transactions: number; gross: number } } = {};
    
    filtered.forEach(sale => {
      const date = dayjs(sale.date).format('YYYY-MM-DD');
      if (!dailyData[date]) {
        dailyData[date] = { date, revenue: 0, transactions: 0, gross: 0 };
      }
      dailyData[date].revenue += sale.net;
      dailyData[date].gross += sale.gross;
      dailyData[date].transactions += 1;
    });

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  // Hourly distribution
  const hourlyDistribution = useMemo(() => {
    const hourlyData: { [key: string]: number } = {};
    
    filtered.forEach(sale => {
      if (sale.time) {
        const hour = parseInt(sale.time.split(':')[0]);
        const hourKey = `${hour}:00`;
        hourlyData[hourKey] = (hourlyData[hourKey] || 0) + sale.net;
      }
    });

    return Object.entries(hourlyData)
      .map(([hour, revenue]) => ({ hour, revenue }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }, [filtered]);

  // Branch performance
  const branchPerformance = useMemo(() => {
    const branchData: { [key: string]: { revenue: number; transactions: number; avgTicket: number } } = {};
    
    filtered.forEach(sale => {
      if (!branchData[sale.branch]) {
        branchData[sale.branch] = { revenue: 0, transactions: 0, avgTicket: 0 };
      }
      branchData[sale.branch].revenue += sale.net;
      branchData[sale.branch].transactions += 1;
    });

    return Object.entries(branchData).map(([branch, data]) => ({
      branch,
      revenue: data.revenue,
      transactions: data.transactions,
      avgTicket: data.transactions > 0 ? data.revenue / data.transactions : 0
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  // Payment method breakdown
  const paymentBreakdown = useMemo(() => {
    const paymentData: { [key: string]: number } = {};
    
    filtered.forEach(sale => {
      paymentData[sale.paymentMethod] = (paymentData[sale.paymentMethod] || 0) + sale.net;
    });

    return Object.entries(paymentData).map(([method, amount]) => ({
      method,
      amount,
      percentage: totals.net > 0 ? (amount / totals.net) * 100 : 0
    }));
  }, [filtered, totals.net]);

  // Top services
  const topServices = useMemo(() => {
    const serviceData: { [key: string]: { revenue: number; count: number } } = {};
    
    filtered.forEach(sale => {
      const services = sale.services.split(',').map(s => s.trim()).filter(Boolean);
      const revenuePerService = sale.net / services.length;
      
      services.forEach(service => {
        if (!serviceData[service]) {
          serviceData[service] = { revenue: 0, count: 0 };
        }
        serviceData[service].revenue += revenuePerService;
        serviceData[service].count += 1;
      });
    });

    return Object.entries(serviceData)
      .map(([service, data]) => ({
        service,
        revenue: data.revenue,
        count: data.count,
        avgPrice: data.count > 0 ? data.revenue / data.count : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filtered]);

  // Barber performance
  const barberPerformance = useMemo(() => {
    const barberData: { [key: string]: { revenue: number; clients: number } } = {};
    
    filtered.forEach(sale => {
      if (!barberData[sale.barber]) {
        barberData[sale.barber] = { revenue: 0, clients: 0 };
      }
      barberData[sale.barber].revenue += sale.net;
      barberData[sale.barber].clients += 1;
    });

    return Object.entries(barberData)
      .map(([barber, data]) => ({
        barber,
        revenue: data.revenue,
        clients: data.clients,
        avgTicket: data.clients > 0 ? data.revenue / data.clients : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₱{totals.net.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metrics.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={metrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(metrics.revenueGrowth).toFixed(1)}%
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.totalTransactions}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.completionRate.toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Ticket</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ₱{metrics.averageTicket.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ₱{totals.gross.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ₱{totals.discount.toLocaleString()} in discounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => dayjs(value).format('MMM DD')}
                />
                <YAxis tickFormatter={(value) => `₱${value.toLocaleString()}`} />
                <Tooltip 
                  formatter={(value: any) => [`₱${value.toLocaleString()}`, 'Revenue']}
                  labelFormatter={(label) => dayjs(label).format('MMM DD, YYYY')}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Branch Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Branch Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={branchPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch" />
                <YAxis tickFormatter={(value) => `₱${value.toLocaleString()}`} />
                <Tooltip formatter={(value: any) => `₱${value.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Hourly Revenue Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis tickFormatter={(value) => `₱${value.toLocaleString()}`} />
                <Tooltip formatter={(value: any) => `₱${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ method, percentage }) => `${method}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {paymentBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `₱${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle>Top Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topServices.map((service, index) => (
                <div key={service.service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{service.service}</p>
                      <p className="text-sm text-gray-600">{service.count} bookings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₱{service.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">₱{service.avgPrice.toLocaleString()} avg</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Barbers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Barbers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {barberPerformance.map((barber, index) => (
                <div key={barber.barber} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{barber.barber}</p>
                      <p className="text-sm text-gray-600">{barber.clients} clients</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₱{barber.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">₱{barber.avgTicket.toLocaleString()} avg</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Period Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{branchPerformance.length}</p>
              <p className="text-sm text-gray-600">Active Branches</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{barberPerformance.length}</p>
              <p className="text-sm text-gray-600">Active Barbers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{topServices.length}</p>
              <p className="text-sm text-gray-600">Services Offered</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{paymentBreakdown.length}</p>
              <p className="text-sm text-gray-600">Payment Methods</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesAnalyticsDashboard;