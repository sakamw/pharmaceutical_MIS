/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatCard } from "@/components/StatCard";
import { AlertCard } from "@/components/AlertCard";
import { Package, DollarSign, AlertTriangle, TrendingUp, Pill, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const { data: summary } = useQuery({
    queryKey: ["reports-summary"],
    queryFn: async () => api.get<any>("/api/reports/summary/"),
  });

  const totalMedicines = summary?.total_medicines ?? undefined; // optional if added later
  const totalStockValue = summary?.total_stock_value || 0;
  const monthlySalesQty = summary?.monthly_sales_qty || 0;
  const belowReorder = summary?.below_reorder || 0;
  const expiringSoon = summary?.expiring_soon || 0;
  const expired = summary?.expired || 0;
  const topFastMoving = (summary?.top_fast_moving || []).map((x: any) => ({
    name: x.medicine__name,
    quantity: x.total,
  }));

  const alerts = [
    { show: belowReorder > 0, title: "Low Stock Alert", description: `${belowReorder} medicine(s) below reorder level` },
    { show: expiringSoon > 0, title: "Expiring Soon", description: `${expiringSoon} batch(es) expiring within 30 days` },
    { show: expired > 0, title: "Expired Stock", description: `${expired} batch(es) have expired`, destructive: true },
  ];

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
          title="Stock Value"
          value={`$${totalStockValue.toLocaleString()}`}
          icon={Pill}
        />
        <StatCard
          title="Monthly Sales (qty)"
          value={monthlySalesQty.toLocaleString()}
          icon={Package}
        />
        <StatCard
          title="Expiring Soon"
          value={expiringSoon}
          icon={DollarSign}
        />
        <StatCard
          title="Expired"
          value={expired}
          icon={ShoppingCart}
        />
      </div>

      {/* Alerts Section */}
      {alerts.some(a => a.show) && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Alerts & Notifications</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {alerts.map((a, idx) => a.show ? (
              <AlertCard
                key={idx}
                title={a.title}
                description={a.description}
                icon={AlertTriangle}
                variant={a.destructive ? "destructive" : undefined}
              />
            ) : null)}
          </div>
        </div>
      )}

      {/* Charts: Top fast-moving items */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Top Fast Moving (Last 30 days)</CardTitle>
            <CardDescription>Quantity sold by medicine</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topFastMoving}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
