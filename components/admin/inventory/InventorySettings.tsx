import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  AlertTriangle, 
  Settings,
  Bell,
  Package,
  Save,
  Plus,
  Trash2,
  Edit
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface InventorySettingsProps {
  categories: string[];
  suppliers: string[];
  users: string[];
  onUpdateCategories: (categories: string[]) => void;
  onUpdateSuppliers: (suppliers: string[]) => void;
}

const InventorySettings = ({ 
  categories, 
  suppliers, 
  users,
  onUpdateCategories,
  onUpdateSuppliers
}: InventorySettingsProps) => {
  // Notification Settings State
  const [notifications, setNotifications] = useState({
    lowStockAlerts: true,
    expirationAlerts: true,
    orderStatusUpdates: true,
    emailNotifications: false,
    smsNotifications: false,
  });

  // System Settings State
  const [systemSettings, setSystemSettings] = useState({
    defaultReorderThreshold: 10,
    lowStockWarningDays: 7,
    expirationWarningDays: 30,
    autoApproveOrders: false,
    requireApprovalAmount: 5000,
  });

  // Dialog States
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);

  // Form States
  const [newCategory, setNewCategory] = useState("");
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact: "",
    email: "",
    phone: "",
  });

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    toast.success("Notification setting updated");
  };

  const handleSystemSettingChange = (key: keyof typeof systemSettings, value: any) => {
    setSystemSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      onUpdateCategories([...categories, newCategory.trim()]);
      setNewCategory("");
      setIsAddCategoryOpen(false);
      toast.success("Category added successfully");
    } else {
      toast.error("Category already exists or is empty");
    }
  };

  const handleRemoveCategory = (category: string) => {
    onUpdateCategories(categories.filter(c => c !== category));
    toast.success("Category removed successfully");
  };

  const handleAddSupplier = () => {
    if (newSupplier.name.trim()) {
      onUpdateSuppliers([...suppliers, newSupplier.name.trim()]);
      setNewSupplier({ name: "", contact: "", email: "", phone: "" });
      setIsAddSupplierOpen(false);
      toast.success("Supplier added successfully");
    } else {
      toast.error("Supplier name is required");
    }
  };

  const handleRemoveSupplier = (supplier: string) => {
    onUpdateSuppliers(suppliers.filter(s => s !== supplier));
    toast.success("Supplier removed successfully");
  };

  const handleSaveSettings = () => {
    // In a real app, this would make API calls to save settings
    toast.success("Settings saved successfully");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Inventory Settings</h2>
          <p className="text-gray-600">Configure system settings and preferences</p>
        </div>
        <Button onClick={handleSaveSettings} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-gray-500">Get notified when items are running low</p>
              </div>
              <Button
                variant={notifications.lowStockAlerts ? "default" : "outline"}
                size="sm"
                onClick={() => handleNotificationToggle('lowStockAlerts')}
              >
                {notifications.lowStockAlerts ? "Enabled" : "Disabled"}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Expiration Alerts</Label>
                <p className="text-sm text-gray-500">Get notified about expiring items</p>
              </div>
              <Button
                variant={notifications.expirationAlerts ? "default" : "outline"}
                size="sm"
                onClick={() => handleNotificationToggle('expirationAlerts')}
              >
                {notifications.expirationAlerts ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Order Status Updates</Label>
                <p className="text-sm text-gray-500">Get notified about order changes</p>
              </div>
              <Button
                variant={notifications.orderStatusUpdates ? "default" : "outline"}
                size="sm"
                onClick={() => handleNotificationToggle('orderStatusUpdates')}
              >
                {notifications.orderStatusUpdates ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive alerts via email</p>
              </div>
              <Button
                variant={notifications.emailNotifications ? "default" : "outline"}
                size="sm"
                onClick={() => handleNotificationToggle('emailNotifications')}
              >
                {notifications.emailNotifications ? "Enabled" : "Disabled"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="defaultReorderThreshold">Default Reorder Threshold</Label>
              <Input
                id="defaultReorderThreshold"
                type="number"
                value={systemSettings.defaultReorderThreshold}
                onChange={(e) => handleSystemSettingChange('defaultReorderThreshold', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="lowStockWarningDays">Low Stock Warning (Days)</Label>
              <Input
                id="lowStockWarningDays"
                type="number"
                value={systemSettings.lowStockWarningDays}
                onChange={(e) => handleSystemSettingChange('lowStockWarningDays', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="expirationWarningDays">Expiration Warning (Days)</Label>
              <Input
                id="expirationWarningDays"
                type="number"
                value={systemSettings.expirationWarningDays}
                onChange={(e) => handleSystemSettingChange('expirationWarningDays', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="requireApprovalAmount">Require Approval Above (₱)</Label>
              <Input
                id="requireApprovalAmount"
                type="number"
                value={systemSettings.requireApprovalAmount}
                onChange={(e) => handleSystemSettingChange('requireApprovalAmount', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader className="text-white">
                    <DialogTitle>Add New Category</DialogTitle>
                    <DialogDescription>
                      Add a new inventory category for organizing items.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="categoryName" className="text-white h-5">Category Name</Label>
                      <Input
                        id="categoryName"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="e.g., Hair Styling Tools"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCategory}>Add Category</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {categories.map((category) => (
                <div key={category} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{category}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveCategory(category)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader className="max-w-md text-white">
                    <DialogTitle>Add New Supplier</DialogTitle>
                    <DialogDescription >
                      Add a new supplier for inventory management.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="supplierName" className="text-white h-4">Supplier Name</Label>
                      <Input
                        id="supplierName"
                        value={newSupplier.name}
                        onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                        placeholder="e.g., Professional Beauty Supply Co."
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplierContact" className="text-white h-4">Contact Person</Label>
                      <Input
                        id="supplierContact"
                        value={newSupplier.contact}
                        onChange={(e) => setNewSupplier({...newSupplier, contact: e.target.value})}
                        placeholder="Contact person name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplierEmail" className="text-white h-4">Email</Label>
                      <Input
                        id="supplierEmail"
                        type="email"
                        value={newSupplier.email}
                        onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                        placeholder="supplier@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplierPhone" className="text-white h-4">Phone</Label>
                      <Input
                        id="supplierPhone"
                        value={newSupplier.phone}
                        onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                        placeholder="+63 XXX XXX XXXX"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddSupplierOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSupplier}>Add Supplier</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {suppliers.map((supplier) => (
                <div key={supplier} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{supplier}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveSupplier(supplier)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>



        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Current user roles and permissions for inventory management.
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
      </div>
    </div>
  );
};

export default InventorySettings;