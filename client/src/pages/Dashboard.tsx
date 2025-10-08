import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { AlertCard } from "@/components/AlertCard";
import { Package, DollarSign, AlertTriangle, TrendingUp, Pill, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const Dashboard = () => {
  const { data: medicines } = useQuery({
    queryKey: ["medicines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: stockBatches } = useQuery({
    queryKey: ["stock-batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_batches")
        .select("*, medicines(name)");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: sales } = useQuery({
    queryKey: ["recent-sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(7);
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate statistics
  const totalMedicines = medicines?.length || 0;
  const totalStock = stockBatches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
  const stockValue = stockBatches?.reduce((sum, batch) => sum + (batch.quantity * batch.purchase_price), 0) || 0;
  const totalSales = sales?.reduce((sum, sale) => sum + parseFloat(sale.total_amount.toString()), 0) || 0;

  // Low stock items
  const lowStockItems = medicines?.filter(med => {
    const totalQty = stockBatches?.filter(b => b.medicine_id === med.id)
      .reduce((sum, b) => sum + b.quantity, 0) || 0;
    return totalQty < med.reorder_level;
  }) || [];

  // Expired or expiring soon (within 30 days)
  const expiringBatches = stockBatches?.filter(batch => {
    const expiryDate = new Date(batch.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  }) || [];

  const expiredBatches = stockBatches?.filter(batch => {
    const expiryDate = new Date(batch.expiry_date);
    return expiryDate < new Date();
  }) || [];

  // Chart data
  const salesChartData = sales?.map(sale => ({
    date: new Date(sale.created_at).toLocaleDateString(),
    amount: parseFloat(sale.total_amount.toString())
  })).reverse() || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your pharmacy.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Medicines"
          value={totalMedicines}
          icon={Pill}
          trend={{ value: "12% from last month", isPositive: true }}
        />
        <StatCard
          title="Total Stock"
          value={totalStock.toLocaleString()}
          icon={Package}
          trend={{ value: "8% from last month", isPositive: true }}
        />
        <StatCard
          title="Stock Value"
          value={`$${stockValue.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          title="Recent Sales"
          value={`$${totalSales.toFixed(2)}`}
          icon={ShoppingCart}
          trend={{ value: "15% from last week", isPositive: true }}
        />
      </div>

      {/* Alerts Section */}
      {(lowStockItems.length > 0 || expiringBatches.length > 0 || expiredBatches.length > 0) && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Alerts & Notifications</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lowStockItems.length > 0 && (
              <AlertCard
                title="Low Stock Alert"
                description={`${lowStockItems.length} medicine(s) below reorder level`}
                icon={AlertTriangle}
                variant="destructive"
              />
            )}
            {expiringBatches.length > 0 && (
              <AlertCard
                title="Expiring Soon"
                description={`${expiringBatches.length} batch(es) expiring within 30 days`}
                icon={AlertTriangle}
              />
            )}
            {expiredBatches.length > 0 && (
              <AlertCard
                title="Expired Stock"
                description={`${expiredBatches.length} batch(es) have expired`}
                icon={AlertTriangle}
                variant="destructive"
              />
            )}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Last 7 transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Overview</CardTitle>
            <CardDescription>Top 5 medicines by quantity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={medicines?.slice(0, 5).map(med => ({
                  name: med.name.substring(0, 10),
                  quantity: stockBatches?.filter(b => b.medicine_id === med.id)
                    .reduce((sum, b) => sum + b.quantity, 0) || 0
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
