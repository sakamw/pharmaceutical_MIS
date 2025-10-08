import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const Stock = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: stockBatches, isLoading } = useQuery({
    queryKey: ["stock-batches-full"],
    queryFn: async () => {
      const data = await api.get<any[]>("/api/stock/");
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

  const filteredBatches = stockBatches?.filter(
    (batch) =>
      batch.medicine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Stock Management</h2>
        <p className="text-muted-foreground">Monitor inventory levels and expiry dates</p>
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
