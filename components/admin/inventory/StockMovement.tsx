import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowUpRight,
  ArrowDownLeft,
  Package,
  User,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAdminRole, useBranchMap } from "@/lib/admin-utils";

interface StockTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'in' | 'out';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  user: string;
  notes: string;
  timestamp: string;
  reason: string;
  branch: string; // Make branch required
}

interface StockMovementProps {
  transactions: StockTransaction[];
  items: Array<{ id: string; name: string; quantity: number; branch?: string }>;
  branches: string[];
  selectedBranches: string[];
  onBranchChange: (branches: string[]) => void;
  onAddTransaction: (transaction: Omit<StockTransaction, 'id' | 'timestamp'>) => void;
}

const StockMovement = ({
  transactions,
  items,
  branches,
  selectedBranches,
  onBranchChange,
  onAddTransaction
}: StockMovementProps) => {
  // Get user role, branch information, and user details
  const { user, userRole, userBranch } = useAdminRole();
  const { getBranchName } = useBranchMap();
  const isManager = userRole === "MANAGER";

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    itemId: '',
    type: 'in' as 'in' | 'out',
    quantity: 0,
    notes: '',
    reason: '',
    branch: '', // Add branch selection
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter transactions based on selected branches and user role
  // For managers, transactions are already filtered by their branch in the parent component
  // For admins, apply additional branch filters if any are selected
  const filteredTransactions = (!isManager && selectedBranches.length > 0)
    ? transactions.filter(transaction =>
      transaction.branch && selectedBranches.includes(transaction.branch)
    )
    : transactions;

  // Calculate pagination
  const totalTransactions = filteredTransactions.length;
  const totalPages = Math.ceil(totalTransactions / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 if current page is beyond total pages
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const getTransactionIcon = (type: string) => {
    return type === 'in' ? (
      <ArrowUpRight className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDownLeft className="h-4 w-4 text-red-600" />
    );
  };

  const getTransactionBadge = (type: string) => {
    return type === 'in' ? (
      <Badge className="bg-green-100 text-green-800">Stock In</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Stock Out</Badge>
    );
  };

  const handleAddTransaction = () => {
    const selectedItem = items.find(item => item.id === newTransaction.itemId);
    if (!selectedItem || !newTransaction.branch) return;

    // Get the current user's name for the transaction
    const currentUser = user?.name || user?.email || 'Unknown User';

    const transaction = {
      itemId: newTransaction.itemId,
      itemName: selectedItem.name,
      type: newTransaction.type,
      quantity: newTransaction.quantity,
      previousQuantity: selectedItem.quantity,
      newQuantity: newTransaction.type === 'in'
        ? selectedItem.quantity + newTransaction.quantity
        : selectedItem.quantity - newTransaction.quantity,
      user: currentUser,
      notes: newTransaction.notes,
      reason: newTransaction.reason,
      branch: newTransaction.branch, // Include branch in transaction
    };

    onAddTransaction(transaction);
    setNewTransaction({
      itemId: '',
      type: 'in',
      quantity: 0,
      notes: '',
      reason: '',
      branch: '',
    });
    setIsAddDialogOpen(false);
  };

  const getReasonOptions = () => {
    const commonReasons = [
      'Restock',
      'Used during service',
      'Damaged/Expired',
      'Transfer to other branch',
      'Initial stock',
      'Return to supplier',
      'Other'
    ];
    return commonReasons;
  };

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

      {/* Branch Display for managers */}
      {isManager && userBranch && (
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="font-medium">Viewing: {getBranchName(userBranch)}</span>
            <Badge variant="secondary">Your Branch</Badge>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Stock Movement</h2>
          <p className="text-gray-600">Track stock in and out transactions</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md text-white">
            <DialogHeader>
              <DialogTitle>Add Stock Transaction</DialogTitle>
              <DialogDescription>
                Record a stock movement transaction.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="branch">Branch</Label>
                <Select 
                  value={newTransaction.branch} 
                  onValueChange={(value) => setNewTransaction({ 
                    ...newTransaction, 
                    branch: value,
                    itemId: '' // Reset item selection when branch changes
                  })}
                >
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
              <div className="space-y-1">
                <Label htmlFor="item">Item</Label>
                <Select 
                  value={newTransaction.itemId} 
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, itemId: value })}
                  disabled={!newTransaction.branch}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!newTransaction.branch ? "Select branch first" : "Select item"} />
                  </SelectTrigger>
                  <SelectContent>
                    {items
                      .filter(item => !newTransaction.branch || item.branch === newTransaction.branch)
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} (Current: {item.quantity})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="type">Transaction Type</Label>
                <Select value={newTransaction.type} onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value as 'in' | 'out' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Stock In</SelectItem>
                    <SelectItem value="out">Stock Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newTransaction.quantity}
                  onChange={(e) => setNewTransaction({ ...newTransaction, quantity: parseInt(e.target.value) || 0 })}
                  min="1"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reason">Reason</Label>
                <Select value={newTransaction.reason} onValueChange={(value) => setNewTransaction({ ...newTransaction, reason: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {getReasonOptions().map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  className="text-black"
                  value={newTransaction.notes}
                  onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
                  placeholder="Additional details about this transaction..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddTransaction}
                disabled={!newTransaction.branch || !newTransaction.itemId || !newTransaction.quantity || !newTransaction.reason}
              >
                Add Transaction
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Previous</TableHead>
                <TableHead>New Total</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="font-medium">{transaction.itemName}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{transaction.branch}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction.type)}
                      {getTransactionBadge(transaction.type)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${transaction.type === 'in' ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {transaction.type === 'in' ? '+' : '-'}{transaction.quantity}
                    </span>
                  </TableCell>
                  <TableCell>{transaction.previousQuantity}</TableCell>
                  <TableCell>
                    <span className="font-medium">{transaction.newQuantity}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.reason}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {transaction.user}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(transaction.timestamp).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.notes && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span className="text-xs text-gray-600 max-w-32 truncate" title={transaction.notes}>
                          {transaction.notes}
                        </span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalTransactions)} of {totalTransactions} transactions
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <Label className="text-sm">Rows per page:</Label>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock In</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredTransactions
                .filter(t => t.type === 'in')
                .reduce((sum, t) => sum + t.quantity, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              This period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Out</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredTransactions
                .filter(t => t.type === 'out')
                .reduce((sum, t) => sum + t.quantity, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              This period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Movement</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${filteredTransactions.reduce((sum, t) => sum + (t.type === 'in' ? t.quantity : -t.quantity), 0) >= 0
              ? 'text-green-600'
              : 'text-red-600'
              }`}>
              {filteredTransactions
                .reduce((sum, t) => sum + (t.type === 'in' ? t.quantity : -t.quantity), 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Net change
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StockMovement;