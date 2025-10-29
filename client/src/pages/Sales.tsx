/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface CartItem {
  medicine_id: string;
  medicine_name: string;
  quantity: number;
  unit_price: number;
}

const Sales = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState("");
  const [quantity, setQuantity] = useState("1");

  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const data = await api.get<any>("/api/sales/");
      return Array.isArray(data) ? data : data?.results ?? data?.data ?? [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - sales data changes with transactions
    refetchInterval: false,
  });

  const { data: medicines } = useQuery({
    queryKey: ["medicines-for-sale"],
    queryFn: async () => {
      const data = await api.get<any>("/api/medicines/");
      return Array.isArray(data) ? data : data?.results ?? data?.data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - medicines don't change often
    refetchInterval: false,
  });

  const createSaleMutation = useMutation({
    mutationFn: async () => {
      // Post one Sale per cart item to the Django API.
      for (const item of cart) {
        await api.post("/api/sales/", {
          medicine: item.medicine_id,
          quantity_sold: item.quantity,
          sale_price: item.unit_price,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["stock-batches-full"] });
      queryClient.invalidateQueries({ queryKey: ["stock-summary"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-alerts"] });
      // Only invalidate medicines if needed - sales don't typically change medicine data
      toast.success("Sale completed successfully! 👍");
      setDialogOpen(false);
      setCart([]);
    },
    onError: (error) => {
      toast.error(`Error: ${(error as any).message}`);
    },
  });

  const addToCart = () => {
    if (!selectedMedicine || !quantity) {
      toast.error("Please select medicine and quantity");
      return;
    }

    const medicine = medicines?.find((m) => m.id === selectedMedicine);

    if (!medicine) return;

    setCart([
      ...cart,
      {
        medicine_id: medicine.id,
        medicine_name: medicine.name,
        quantity: parseInt(quantity),
        unit_price: parseFloat(medicine.unit_price.toString()),
      },
    ]);

    setSelectedMedicine("");
    setQuantity("1");
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const filteredSales = sales?.filter((sale) => {
    const hay = `${sale.medicine_name || ""}`.toLowerCase();
    return hay.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sales</h2>
          <p className="text-muted-foreground">
            Process sales and view transaction history
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Point of Sale</DialogTitle>
              <DialogDescription>
                Create a new sale transaction
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Add Items</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  <Select
                    value={selectedMedicine}
                    onValueChange={setSelectedMedicine}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select medicine" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicines?.map((med) => (
                        <SelectItem key={med.id} value={med.id}>
                          {med.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Qty"
                  />

                  <Button onClick={addToCart} type="button">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {cart.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cart Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.medicine_name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>Ksh {item.unit_price}</TableCell>
                            <TableCell>
                              Ksh {(item.quantity * item.unit_price).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="font-bold text-right"
                          >
                            Total:
                          </TableCell>
                          <TableCell className="font-bold">
                            Ksh {totalAmount.toFixed(2)}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createSaleMutation.mutate()}
                disabled={cart.length === 0 || createSaleMutation.isPending}
              >
                {createSaleMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Complete Sale
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {salesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales?.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        {sale.medicine_name}
                      </TableCell>
                      <TableCell>{sale.quantity_sold}</TableCell>
                      <TableCell className="font-semibold">
                        Ksh {parseFloat(sale.sale_price.toString()).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(sale.sale_date), "MMM dd, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Sales;
