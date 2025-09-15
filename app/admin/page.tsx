"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import Link from "next/link";
import dayjs from "dayjs";
import {
  Calendar,
  Clock,
  DollarSign,
  Package,
  TrendingUp,
  Users,
  AlertTriangle,
  Activity,
  ShoppingCart,
  BarChart3,
  Plus,
  Eye,
  Settings,
  Receipt,
  UserCheck,
  MapPin,
  Zap
} from "lucide-react";

interface DashboardStats {
  appointments: {
    total: number;
    today: number;
    pending: number;
    completed: number;
  };
  sales: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  inventory: {
    totalItems: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  };
  staff: {
    total: number;
    available: number;
    onLeave: number;
    scheduled: number;
  };
}

interface RecentActivity {
  id: string;
  type: "appointment" | "sale" | "inventory" | "staff";
  action: string;
  description: string;
  timestamp: string;
  user: string;
  status?: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    appointments: { total: 0, today: 0, pending: 0, completed: 0 },
    sales: { total: 0, today: 0, thisWeek: 0, thisMonth: 0 },
    inventory: { totalItems: 0, lowStock: 0, outOfStock: 0, totalValue: 0 },
    staff: { total: 0, available: 0, onLeave: 0, scheduled: 0 }
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [appointmentsRes, inventoryRes, barbersRes, salesRes] = await Promise.all([
        fetch('/api/admin/appointments').then(r => r.json()).catch(() => []),
        fetch('/api/inventory/items').then(r => r.json()).catch(() => []),
        fetch('/api/barbers').then(r => r.json()).catch(() => []),
        fetch('/api/admin/sales').then(r => r.json()).catch(() => [])
      ]);

      setAppointments(Array.isArray(appointmentsRes) ? appointmentsRes : []);
      setInventoryItems(Array.isArray(inventoryRes) ? inventoryRes : []);
      setBarbers(Array.isArray(barbersRes) ? barbersRes : []);
      
      // Debug logging for sales data
      console.log('Sales data fetched:', salesRes);
      console.log('Sales data length:', Array.isArray(salesRes) ? salesRes.length : 'Not an array');

      // Calculate statistics
      const today = dayjs().format('YYYY-MM-DD');
      const thisWeek = dayjs().startOf('week').format('YYYY-MM-DD');
      const thisMonth = dayjs().startOf('month').format('YYYY-MM-DD');

      // Appointment stats
      const appointmentStats = {
        total: appointmentsRes.length || 0,
        today: appointmentsRes.filter((a: any) => a.appointmentDate === today).length || 0,
        pending: appointmentsRes.filter((a: any) => new Date(`${a.appointmentDate}T${a.appointmentTime}`) > new Date()).length || 0,
        completed: appointmentsRes.filter((a: any) => new Date(`${a.appointmentDate}T${a.appointmentTime}`) < new Date()).length || 0
      };

      // Sales stats (using actual sales data)
      const salesData = Array.isArray(salesRes) ? salesRes : [];
      const salesStats = {
        total: salesData.reduce((sum: number, s: any) => sum + (parseFloat(s.net) || 0), 0),
        today: salesData.filter((s: any) => dayjs(s.date).format('YYYY-MM-DD') === today)
          .reduce((sum: number, s: any) => sum + (parseFloat(s.net) || 0), 0),
        thisWeek: salesData.filter((s: any) => dayjs(s.date).format('YYYY-MM-DD') >= thisWeek)
          .reduce((sum: number, s: any) => sum + (parseFloat(s.net) || 0), 0),
        thisMonth: salesData.filter((s: any) => dayjs(s.date).format('YYYY-MM-DD') >= thisMonth)
          .reduce((sum: number, s: any) => sum + (parseFloat(s.net) || 0), 0)
      };

      // Inventory stats
      const inventoryStats = {
        totalItems: inventoryRes.length || 0,
        lowStock: inventoryRes.filter((item: any) => item.quantity <= item.reorderThreshold).length || 0,
        outOfStock: inventoryRes.filter((item: any) => item.quantity === 0).length || 0,
        totalValue: inventoryRes.reduce((sum: number, item: any) => sum + (item.quantity * parseFloat(item.unitPrice || 0)), 0) || 0
      };

      // Staff stats
      const staffStats = {
        total: barbersRes.length || 0,
        available: barbersRes.filter((b: any) => !b.onLeave).length || 0,
        onLeave: barbersRes.filter((b: any) => b.onLeave).length || 0,
        scheduled: appointmentsRes.filter((a: any) => a.appointmentDate === today).length || 0
      };

      setStats({
        appointments: appointmentStats,
        sales: salesStats,
        inventory: inventoryStats,
        staff: staffStats
      });

      // Generate recent activity
      const activity: RecentActivity[] = [];
      
      // Add recent appointments
      const recentAppointments = appointmentsRes
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      recentAppointments.forEach((appointment: any) => {
        activity.push({
          id: appointment.id,
          type: "appointment",
          action: "New Appointment",
          description: `${appointment.fullName} - ${appointment.services}`,
          timestamp: appointment.createdAt,
          user: appointment.fullName,
          status: new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`) > new Date() ? "pending" : "completed"
        });
      });

      // Add recent inventory changes
      const recentInventory = inventoryRes
        .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 3);
      
      recentInventory.forEach((item: any) => {
        activity.push({
          id: item.id,
          type: "inventory",
          action: item.quantity <= item.reorderThreshold ? "Low Stock Alert" : "Item Updated",
          description: `${item.name} - Qty: ${item.quantity}`,
          timestamp: item.updatedAt || item.createdAt,
          user: "System"
        });
      });

      setRecentActivity(activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
      case 'sale':
        return <DollarSign className="h-4 w-4" />;
      case 'inventory':
        return <Package className="h-4 w-4" />;
      case 'staff':
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-admin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your business today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDashboardData}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appointments.today}</div>
            <p className="text-xs text-muted-foreground">
              {stats.appointments.pending} pending, {stats.appointments.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{stats.sales.today.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.sales.thisWeek > stats.sales.today ? '+' : ''}₱{(stats.sales.thisWeek - stats.sales.today).toLocaleString()} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inventory.lowStock + stats.inventory.outOfStock}</div>
            <p className="text-xs text-muted-foreground">
              {stats.inventory.lowStock} low stock, {stats.inventory.outOfStock} out of stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Available</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.staff.available}</div>
            <p className="text-xs text-muted-foreground">
              {stats.staff.scheduled} scheduled today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.slice(0, 8).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {dayjs(activity.timestamp).format('MMM DD, HH:mm')} • {activity.user}
                        </p>
                      </div>
                      {activity.status && getStatusBadge(activity.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/admin/appointments">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                      <Calendar className="h-5 w-5" />
                      <span>View Appointments</span>
                    </Button>
                  </Link>
                  <Link href="/admin/inventory">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                      <Package className="h-5 w-5" />
                      <span>Manage Inventory</span>
                    </Button>
                  </Link>
                  <Link href="/admin/sales">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                      <Receipt className="h-5 w-5" />
                      <span>Sales Report</span>
                    </Button>
                  </Link>
                  <Link href="/admin/scheduling">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                      <Clock className="h-5 w-5" />
                      <span>Staff Schedule</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Today's Appointments
                </span>
                <Link href="/admin/appointments">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Barber</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments
                    .filter((a) => a.appointmentDate === dayjs().format('YYYY-MM-DD'))
                    .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
                    .slice(0, 5)
                    .map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>{appointment.appointmentTime}</TableCell>
                        <TableCell>{appointment.fullName}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{appointment.services}</TableCell>
                        <TableCell>{appointment.barber || 'No Preference'}</TableCell>
                        <TableCell>
                          {getStatusBadge(
                            new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`) > new Date() 
                              ? 'pending' 
                              : 'completed'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Low Stock Items
                </span>
                <Link href="/admin/inventory">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryItems
                    .filter((item) => item.quantity <= item.reorderThreshold)
                    .slice(0, 5)
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.reorderThreshold}</TableCell>
                        <TableCell>{item.supplier}</TableCell>
                        <TableCell>
                          <Badge variant={item.quantity === 0 ? "destructive" : "secondary"}>
                            {item.quantity === 0 ? "Out of Stock" : "Low Stock"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Staff Overview
                </span>
                <Link href="/admin/scheduling">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Schedule
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {barbers.slice(0, 6).map((barber) => (
                  <div key={barber.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-admin rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {barber.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{barber.name}</p>
                        <p className="text-sm text-muted-foreground">{barber.branches?.join(', ') || 'No Branch'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
