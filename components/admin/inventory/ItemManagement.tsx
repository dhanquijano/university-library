import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BranchFilter from "./BranchFilter";
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
  Edit, 
  Trash2, 
  Package, 
  AlertTriangle,
  Calendar,
  Coins
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  reorderThreshold: number;
  unitPrice: number;
  supplier: string;
  expirationDate?: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  branch: string;
}

interface ItemManagementProps {
  items: InventoryItem[];
  categories: string[];
  suppliers: string[];
  branches: string[];
  selectedBranches: string[];
  onBranchChange: (branches: string[]) => void;
  onAddItem: (item: any) => Promise<void>;
  onUpdateItem: (id: string, updates: any) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

const ItemManagement = ({ 
  items = [], 
  categories = [], 
  suppliers = [],
  branches = [],
  selectedBranches = [],
  onBranchChange,
  onAddItem,
  onUpdateItem,
  onDeleteItem
}: ItemManagementProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Helper function to calculate correct status based on quantity and reorder threshold
  const calculateItemStatus = (quantity: number, reorderThreshold: number) => {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= reorderThreshold) return 'low-stock';
    return 'in-stock';
  };
  
  // Ensure editingItem stays in sync when items are updated from parent
  useEffect(() => {
    if (editingItem) {
      const updatedItem = items.find(item => item.id === editingItem.id);
      if (updatedItem) {
        setEditingItem(updatedItem);
      }
    }
  }, [items, editingItem?.id]);
  const [newItem, setNewItem] = useState({
    name: '',
    sku: '',
    category: '',
    quantity: 0,
    reorderThreshold: 10,
    unitPrice: 0,
    supplier: '',
    expirationDate: '',
    branch: '',
  });

  // Filter items based on selected branches
  const filteredItems = selectedBranches.length > 0 
    ? items.filter(item => selectedBranches.includes(item.branch))
    : items;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-stock':
        return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
      case 'low-stock':
        return <Badge className="bg-orange-100 text-orange-800">Low Stock</Badge>;
      case 'out-of-stock':
        return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const handleAddItem = async () => {
    try {
      // Validate that required fields are filled
      if (!newItem.name || !newItem.sku || !newItem.category || !newItem.supplier || !newItem.branch) {
        alert('Please fill in all required fields including branch selection');
        return;
      }

      const item = {
        ...newItem,
        status: calculateItemStatus(newItem.quantity, newItem.reorderThreshold)
      };
      
      console.log('Adding item with branch:', item.branch);
      console.log('Full item data:', item);
      
      await onAddItem(item);
      setNewItem({
        name: '', sku: '', category: '', quantity: 0, reorderThreshold: 10, unitPrice: 0, supplier: '', expirationDate: '', branch: '',
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleUpdateItem = async () => {
    if (editingItem) {
      try {
        // Only send the fields that should be updated, with proper types
        const updatedItem = {
          name: editingItem.name,
          sku: editingItem.sku,
          category: editingItem.category,
          quantity: parseInt(editingItem.quantity.toString()) || 0,
          reorderThreshold: parseInt(editingItem.reorderThreshold.toString()) || 10,
          unitPrice: parseFloat(editingItem.unitPrice.toString()) || 0,
          supplier: editingItem.supplier,
          expirationDate: editingItem.expirationDate || null,
          branch: editingItem.branch,
          status: calculateItemStatus(editingItem.quantity, editingItem.reorderThreshold)
        };
        
        console.log('Sending update data:', updatedItem);
        await onUpdateItem(editingItem.id, updatedItem);
        setEditingItem(null);
      } catch (error) {
        console.error('Error updating item:', error);
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    await onDeleteItem(id);
  };

  return (
    <div className="space-y-6">
      {/* Branch Filter */}
      <BranchFilter
        branches={branches}
        selectedBranches={selectedBranches}
        onBranchChange={onBranchChange}
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Item Management</h2>
          <p className="text-gray-600">Manage inventory items and their details</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md text-white">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>
                Enter the details for the new inventory item.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Professional Hair Clippers"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sku">SKU/ID</Label>
                <Input
                  id="sku"
                  value={newItem.sku}
                  onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                  placeholder="e.g., HC-001"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="category">Category</Label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reorderThreshold">Reorder Threshold</Label>
                  <Input
                    id="reorderThreshold"
                    type="number"
                    value={newItem.reorderThreshold}
                    onChange={(e) => setNewItem({ ...newItem, reorderThreshold: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="unitPrice">Unit Price (₱)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  value={newItem.unitPrice}
                  onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1" >
                <Label htmlFor="supplier">Supplier</Label>
                <Select value={newItem.supplier} onValueChange={(value) => setNewItem({ ...newItem, supplier: value })}>
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
                <Label htmlFor="branch">Branch *</Label>
                <Select value={newItem.branch} onValueChange={(value) => setNewItem({ ...newItem, branch: value })}>
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
              <div>
                <Label htmlFor="expirationDate">Expiration Date (Optional)</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={newItem.expirationDate}
                  onChange={(e) => setNewItem({ ...newItem, expirationDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddItem}
                disabled={!newItem.name || !newItem.sku || !newItem.category || !newItem.supplier || !newItem.branch}
              >
                Add Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.expirationDate && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Expires: {new Date(item.expirationDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{item.sku}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.quantity}</span>
                      {item.quantity <= item.reorderThreshold && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      ₱{item.unitPrice.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell>{item.branch}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItem(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-md text-white">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update the item details.
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="edit-name">Item Name</Label>
                <Input
                  id="edit-name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-sku">SKU/ID</Label>
                <Input
                  id="edit-sku"
                  value={editingItem.sku}
                  onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={editingItem.category} onValueChange={(value) => setEditingItem({ ...editingItem, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-quantity">Quantity</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-reorderThreshold">Reorder Threshold</Label>
                  <Input
                    id="edit-reorderThreshold"
                    type="number"
                    value={editingItem.reorderThreshold}
                    onChange={(e) => setEditingItem({ ...editingItem, reorderThreshold: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-unitPrice">Unit Price (₱)</Label>
                <Input
                  id="edit-unitPrice"
                  type="number"
                  value={editingItem.unitPrice}
                  onChange={(e) => setEditingItem({ ...editingItem, unitPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-supplier">Supplier</Label>
                <Select value={editingItem.supplier} onValueChange={(value) => setEditingItem({ ...editingItem, supplier: value })}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label htmlFor="edit-branch">Branch</Label>
                <Select value={editingItem.branch} onValueChange={(value) => setEditingItem({ ...editingItem, branch: value })}>
                  <SelectTrigger>
                    <SelectValue />
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
              <div>
                <Label htmlFor="edit-expirationDate">Expiration Date (Optional)</Label>
                <Input
                  id="edit-expirationDate"
                  type="date"
                  value={editingItem.expirationDate || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, expirationDate: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateItem}>Update Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemManagement;