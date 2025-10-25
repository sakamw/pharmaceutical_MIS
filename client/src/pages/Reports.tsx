/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Loader2,
  TrendingUp,
  Package,
  DollarSign,
  Clock,
} from "lucide-react";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1"];

const Reports = () => {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["reports-summary"],
    queryFn: async () => api.get<any>("/api/reports/summary/"),
    staleTime: 2 * 60 * 1000, // 2 minutes - summary data is relatively stable
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes instead of 30 seconds
  });

  const { data: salesTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ["reports-sales-trends"],
    queryFn: async () => api.get<any>("/api/reports/sales-trends/?days=90"),
    staleTime: 5 * 60 * 1000, // 5 minutes - sales trends don't change rapidly
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes instead of 1 minute
  });

  const { data: stockAnalysis, isLoading: stockLoading } = useQuery({
    queryKey: ["reports-stock-analysis"],
    queryFn: async () => api.get<any>("/api/reports/stock-analysis/"),
    staleTime: 3 * 60 * 1000, // 3 minutes - stock analysis needs moderate freshness
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes instead of 1 minute
  });

  const { data: inventoryTurnover } = useQuery({
    queryKey: ["reports-inventory-turnover"],
    queryFn: async () => api.get<any>("/api/reports/inventory-turnover/"),
    staleTime: 10 * 60 * 1000, // 10 minutes - turnover analysis is stable
    refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes instead of 5 minutes
  });

  const topFastMoving = (summary?.top_fast_moving || []).map((x: any) => ({
    name: x.medicine__name,
    quantity: x.total,
  }));

  const expiryData = [
    { name: "Expiring Soon", value: summary?.expiring_soon || 0 },
    { name: "Expired", value: summary?.expired || 0 },
  ];

  if (summaryLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Reports & Analytics
        </h2>
        <p className="text-muted-foreground">
          Comprehensive overview of inventory health, sales performance, and
          business insights
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Stock Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Ksh {summary?.total_stock_value?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Current inventory value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.monthly_sales_qty || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Units sold (last 30 days)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Below Reorder</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summary?.below_reorder || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Medicines need restocking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {summary?.expiring_soon || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Batches expiring in 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales Trends</TabsTrigger>
          <TabsTrigger value="stock">Stock Analysis</TabsTrigger>
          <TabsTrigger value="turnover">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
                <CardDescription>
                  Expiring soon vs expired batches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={expiryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {expiryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          {trendsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Sales Trends</CardTitle>
                  <CardDescription>
                    Revenue and quantity over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={salesTrends?.monthly_trends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            year: "2-digit",
                          })
                        }
                      />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip
                        labelFormatter={(value) =>
                          new Date(value).toLocaleDateString()
                        }
                        formatter={(value: any, name: string) => [
                          name === "total_revenue"
                            ? `Ksh ${value?.toLocaleString()}`
                            : value,
                          name === "total_revenue" ? "Revenue" : "Quantity",
                        ]}
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="total_quantity"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="total_revenue"
                        stackId="2"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily Sales (Last 30 Days)</CardTitle>
                  <CardDescription>Daily transaction patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={salesTrends?.daily_trends?.slice(-30) || []}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="sale_date"
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(value) =>
                          new Date(value).toLocaleDateString()
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="total_quantity"
                        stroke="#8884d8"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="transaction_count"
                        stroke="#82ca9d"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="stock" className="space-y-6">
          {stockLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Expiry Risk Analysis</CardTitle>
                  <CardDescription>
                    Potential losses from expiry
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Expiring in 30 days</p>
                        <p className="text-sm text-muted-foreground">
                          {stockAnalysis?.expiring_30_days?.quantity || 0}{" "}
                          units
                        </p>
                      </div>
                      <Badge variant="default">
                        Ksh{" "}
                        {(
                          stockAnalysis?.expiring_30_days?.value || 0
                        ).toLocaleString()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Expiring in 90 days</p>
                        <p className="text-sm text-muted-foreground">
                          {stockAnalysis?.expiring_90_days?.quantity || 0}{" "}
                          units
                        </p>
                      </div>
                      <Badge variant="secondary">
                        Ksh{" "}
                        {(
                          stockAnalysis?.expiring_90_days?.value || 0
                        ).toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Medicines by Stock Value</CardTitle>
                  <CardDescription>
                    Highest value inventory items
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine</TableHead>
                          <TableHead>Stock Value</TableHead>
                          <TableHead>Quantity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(stockAnalysis?.top_medicines_by_value || []).map(
                          (med: any) => (
                            <TableRow key={med.name}>
                              <TableCell className="font-medium">
                                {med.name}
                              </TableCell>
                              <TableCell>
                                Ksh {med.stock_value.toLocaleString()}
                              </TableCell>
                              <TableCell>{med.total_quantity}</TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="turnover" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Turnover Analysis</CardTitle>
              <CardDescription>
                Fastest and slowest moving inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicine</TableHead>
                      <TableHead>Avg Stock</TableHead>
                      <TableHead>6-Month Sales</TableHead>
                      <TableHead>Daily Rate</TableHead>
                      <TableHead>Turnover Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(inventoryTurnover?.inventory_turnover || []).map(
                      (item: any) => (
                        <TableRow key={item.medicine_name}>
                          <TableCell className="font-medium">
                            {item.medicine_name}
                          </TableCell>
                          <TableCell>{item.avg_stock_level}</TableCell>
                          <TableCell>{item.total_sold_6months}</TableCell>
                          <TableCell>{item.daily_sales_rate}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.turnover_rate > 0.1
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {item.turnover_rate}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
