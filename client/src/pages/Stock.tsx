import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, AlertTriangle, CheckCircle, Plus, Edit, Trash2 } from "lucide-react";
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
    queryKey: ["medicines"],
    queryFn: async () => {
      const data = await api.get<any[]>("/api/medicines/");
      return data || [];
    },
  });

  const getExpiryStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: "Expired", variant: "destructive" as const, icon: AlertTriangle };
    } else if (daysUntilExpiry <= 30) {
      return { status: "Expiring Soon", variant: "default" as const, icon: AlertTriangle };
    } else {
      return { status: "Good", variant: "outline" as const, icon: CheckCircle };
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post("/api/stock/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-batches-full"] });
      toast.success("Stock batch added successfully");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Error: ${(error as any).message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await api.put(`/api/stock/${id}/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-batches-full"] });
      toast.success("Stock batch updated successfully");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Error: ${(error as any).message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/stock/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-batches-full"] });
      toast.success("Stock batch deleted successfully");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      medicine: parseInt(formData.medicine),
      batch_number: formData.batch_number,
      expiry_date: formData.expiry_date,
      quantity: parseInt(formData.quantity),
      purchase_price: parseFloat(formData.purchase_price),
    };

    if (editingStock) {
      updateMutation.mutate({ id: editingStock.id, data });
    } else {
      createMutation.mutate(data);
    }
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
          <h2 className="text-3xl font-bold tracking-tight">Stock Management</h2>
          <p className="text-muted-foreground">Monitor inventory levels and expiry dates</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" /> Add Stock Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingStock ? "Edit Stock Batch" : "Add New Stock Batch"}
              </DialogTitle>
              <DialogDescription>
                {editingStock
                  ? "Update stock batch information"
                  : "Add a new stock batch to your inventory"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="medicine">Medicine *</Label>
                  <Select
                    value={formData.medicine}
                    onValueChange={(value) => setFormData({ ...formData, medicine: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select medicine" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicines?.map((med) => (
                        <SelectItem key={med.id} value={med.id.toString()}>
                          {med.name} - {med.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch_number">Batch Number *</Label>
                  <Input
                    id="batch_number"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Expiry Date *</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase_price">Purchase Price ($) *</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingStock ? "Update" : "Add"} Stock Batch
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Batches</CardTitle>
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches?.map((batch) => {
                    const expiryInfo = getExpiryStatus(batch.expiry_date);
                    const StatusIcon = expiryInfo.icon;
                    return (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{batch.medicine_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{batch.medicine_category}</Badge>
                        </TableCell>
                        <TableCell>{batch.batch_number}</TableCell>
                        <TableCell>{batch.supplier_name || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={batch.quantity < 10 ? "destructive" : "default"}>
                            {batch.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>${batch.purchase_price}</TableCell>
                        <TableCell>{format(new Date(batch.expiry_date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={expiryInfo.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {expiryInfo.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
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
                                if (confirm("Are you sure you want to delete this stock batch?")) {
                                  deleteMutation.mutate(batch.id);
                                }
                              }}
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
    </div>
  );
};

export default Stock;
