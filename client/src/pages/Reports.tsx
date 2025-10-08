import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1"]; // palette

const Reports = () => {
  const { data: summary } = useQuery({
    queryKey: ["reports-summary"],
    queryFn: async () => api.get<any>("/api/reports/summary/"),
  });

  const topFastMoving = (summary?.top_fast_moving || []).map((x: any) => ({
    name: x.medicine__name,
    quantity: x.total,
  }));

  const expiryData = [
    { name: "Expiring Soon", value: summary?.expiring_soon || 0 },
    { name: "Expired", value: summary?.expired || 0 },
  ];

  const belowReorder = summary?.below_reorder || 0;
  const stockValue = summary?.total_stock_value || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
        <p className="text-muted-foreground">Overview of inventory health and sales performance</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Fast Moving (Last 30 days)</CardTitle>
            <CardDescription>Quantity sold by medicine</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
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

        <Card>
          <CardHeader>
            <CardTitle>Expiry Overview</CardTitle>
            <CardDescription>Expiring soon vs expired batches</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie dataKey="value" data={expiryData} cx="50%" cy="50%" outerRadius={100} label>
                  {expiryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Below Reorder</CardTitle>
            <CardDescription>Number of medicines below reorder level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{belowReorder}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Stock Value</CardTitle>
            <CardDescription>Current inventory value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">${stockValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
