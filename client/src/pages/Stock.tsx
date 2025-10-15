/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Package,
  TrendingDown,
  Clock,
  DollarSign,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const Stock = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<any>(null);
  const [formData, setFormData] = useState({
    medicine: "",
    batch_number: "",
    expiry_date: "",
    quantity: "",
    purchase_price: "",
  });

  const { data: stockBatches, isLoading } = useQuery({
    queryKey: ["stock-batches-full"],
    queryFn: async () => {
      const data = await api.get<any[]>("/api/stock/");
      return data || [];
    },
  });

  const { data: medicines } = useQuery({
    queryKey: ["medicines-for-stock"],
    queryFn: async () => {
      const data = await api.get<any[]>("/api/medicines/");
      return data || [];
    },
  });

  const { data: stockSummary } = useQuery({
    queryKey: ["stock-summary"],
    queryFn: async () => {
      const data = await api.get<any>("/api/stock/summary/");
      return data;
    },
  });

  const { data: lowStockAlerts } = useQuery({
    queryKey: ["low-stock-alerts"],
    queryFn: async () => {
      const data = await api.get<any[]>("/api/stock/low_stock_alerts/");
      return data || [];
    },
  });

  const { data: expiringSoon } = useQuery({
    queryKey: ["expiring-soon"],
    queryFn: async () => {
      const data = await api.get<any[]>("/api/stock/expiring_soon/");
      return data || [];
    },
  });

  const { data: expiredStock } = useQuery({
    queryKey: ["expired-stock"],
    queryFn: async () => {
      const data = await api.get<any[]>("/api/stock/expired/");
      return data || [];
    },
  });

  const createStockMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post("/api/stock/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-batches-full"] });
      queryClient.invalidateQueries({ queryKey: ["stock-summary"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-alerts"] });
      toast.success("Stock added successfully");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Error: ${(error as any).message}`);
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await api.put(`/api/stock/${id}/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-batches-full"] });
      queryClient.invalidateQueries({ queryKey: ["stock-summary"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-alerts"] });
      toast.success("Stock updated successfully");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Error: ${(error as any).message}`);
    },
  });

  const deleteStockMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/stock/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-batches-full"] });
      queryClient.invalidateQueries({ queryKey: ["stock-summary"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-alerts"] });
      toast.success("Stock deleted successfully");
    },
    onError: (error) => {
      toast.error(`Error: ${(error as any).message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      medicine: "",
      batch_number: "",
      expiry_date: "",
      quantity: "",
      purchase_price: "",
    });
    setEditingStock(null);
  };

  const handleEdit = (stock: any) => {
    setEditingStock(stock);
    setFormData({
      medicine: stock.medicine.toString(),
      batch_number: stock.batch_number,
      expiry_date: stock.expiry_date,
      quantity: stock.quantity.toString(),
      purchase_price: stock.purchase_price.toString(),
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      medicine: parseInt(formData.medicine),
      batch_number: formData.batch_number,
      expiry_date: formData.expiry_date,
      quantity: parseInt(formData.quantity),
      purchase_price: parseFloat(formData.purchase_price),
    };

    if (editingStock) {
      updateStockMutation.mutate({ id: editingStock.id, data: submitData });
    } else {
      createStockMutation.mutate(submitData);
    }
  };

  const getExpiryStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      return {
        status: "Expired",
        variant: "destructive" as const,
        icon: AlertTriangle,
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: "Expiring Soon",
        variant: "default" as const,
        icon: AlertTriangle,
      };
    } else {
      return { status: "Good", variant: "outline" as const, icon: CheckCircle };
    }
  };

  const filteredBatches = stockBatches?.filter(
    (batch) =>
      batch.medicine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Stock Management
          </h2>
          <p className="text-muted-foreground">
            Monitor inventory levels, expiry dates, and stock alerts
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" /> Add Stock
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingStock ? "Edit Stock" : "Add New Stock"}
              </DialogTitle>
              <DialogDescription>
                {editingStock
                  ? "Update stock batch information"
                  : "Add a new stock batch to inventory"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medicine">Medicine</Label>
                <Select
                  value={formData.medicine}
                  onValueChange={(value) =>
                    setFormData({ ...formData, medicine: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select medicine" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicines?.map((med) => (
                      <SelectItem key={med.id} value={med.id.toString()}>
                        {med.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch_number">Batch Number</Label>
                <Input
                  id="batch_number"
                  value={formData.batch_number}
                  onChange={(e) =>
                    setFormData({ ...formData, batch_number: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expiry_date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_price">Purchase Price</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchase_price}
                  onChange={(e) =>
                    setFormData({ ...formData, purchase_price: e.target.value })
                  }
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createStockMutation.isPending ||
                    updateStockMutation.isPending
                  }
                >
                  {createStockMutation.isPending ||
                  updateStockMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingStock ? "Updating..." : "Adding..."}
                    </>
                  ) : editingStock ? (
                    "Update Stock"
                  ) : (
                    "Add Stock"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stock Summary Cards */}
      {stockSummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Medicines
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stockSummary.total_medicines}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stockSummary.total_stock_value.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stockSummary.low_stock_count}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expiring Soon
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stockSummary.expiring_count}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {lowStockAlerts && lowStockAlerts.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Low Stock Alert:</strong> {lowStockAlerts.length} medicines
            are below reorder level.
            <Button variant="link" className="p-0 h-auto ml-2">
              View Details
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all-stock" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all-stock">All Stock</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value="all-stock">
          <Card>
            <CardHeader>
              <CardTitle>All Stock Batches</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by medicine, batch number, or supplier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Batch Number</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Purchase Price</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBatches?.map((batch) => {
                        const expiryInfo = getExpiryStatus(batch.expiry_date);
                        const StatusIcon = expiryInfo.icon;
                        return (
                          <TableRow key={batch.id}>
                            <TableCell className="font-medium">
                              {batch.medicine_name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {batch.medicine_category}
                              </Badge>
                            </TableCell>
                            <TableCell>{batch.batch_number}</TableCell>
                            <TableCell>
                              {batch.supplier_name || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  batch.quantity < 10
                                    ? "destructive"
                                    : "default"
                                }
                              >
                                {batch.quantity}
                              </Badge>
                            </TableCell>
                            <TableCell>${batch.purchase_price}</TableCell>
                            <TableCell>
                              {format(
                                new Date(batch.expiry_date),
                                "MMM dd, yyyy"
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={expiryInfo.variant}
                                className="gap-1"
                              >
                                <StatusIcon className="h-3 w-3" />
                                {expiryInfo.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(batch)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "Are you sure you want to delete this stock batch?"
                                      )
                                    ) {
                                      deleteStockMutation.mutate(batch.id);
                                    }
                                  }}
                                  disabled={deleteStockMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
              <CardDescription>Medicines below reorder level</CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockAlerts && lowStockAlerts.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Reorder Level</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Urgency</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockAlerts.map((alert) => (
                        <TableRow key={alert.medicine_id}>
                          <TableCell className="font-medium">
                            {alert.medicine_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{alert.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">
                              {alert.current_stock}
                            </Badge>
                          </TableCell>
                          <TableCell>{alert.reorder_level}</TableCell>
                          <TableCell>{alert.supplier || "N/A"}</TableCell>
                          <TableCell>${alert.unit_price}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                alert.urgency === "critical"
                                  ? "destructive"
                                  : "default"
                              }
                            >
                              {alert.urgency}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No low stock alerts
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring">
          <Card>
            <CardHeader>
              <CardTitle>Expiring Soon</CardTitle>
              <CardDescription>
                Stock batches expiring within 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expiringSoon && expiringSoon.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Batch Number</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Days Until Expiry</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expiringSoon.map((batch) => (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">
                            {batch.medicine_name}
                          </TableCell>
                          <TableCell>{batch.batch_number}</TableCell>
                          <TableCell>{batch.quantity}</TableCell>
                          <TableCell>
                            {format(
                              new Date(batch.expiry_date),
                              "MMM dd, yyyy"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">
                              {batch.days_until_expiry} days
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No stock expiring soon
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired">
          <Card>
            <CardHeader>
              <CardTitle>Expired Stock</CardTitle>
              <CardDescription>Stock batches that have expired</CardDescription>
            </CardHeader>
            <CardContent>
              {expiredStock && expiredStock.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Batch Number</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Days Expired</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expiredStock.map((batch) => (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">
                            {batch.medicine_name}
                          </TableCell>
                          <TableCell>{batch.batch_number}</TableCell>
                          <TableCell>{batch.quantity}</TableCell>
                          <TableCell>
                            {format(
                              new Date(batch.expiry_date),
                              "MMM dd, yyyy"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">
                              {Math.abs(batch.days_until_expiry)} days
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No expired stock
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Stock;
