import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BarChart3 } from "lucide-react";

const Reports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
        <p className="text-muted-foreground">Generate insights and performance reports</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <FileText className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Sales Reports</CardTitle>
            <CardDescription>View sales by date, category, or medicine</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <BarChart3 className="h-8 w-8 text-accent mb-2" />
            <CardTitle>Stock Reports</CardTitle>
            <CardDescription>Current levels and reorder items</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <FileText className="h-8 w-8 text-warning mb-2" />
            <CardTitle>Expiry Reports</CardTitle>
            <CardDescription>Track expiring and expired medicines</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <BarChart3 className="h-8 w-8 text-success mb-2" />
            <CardTitle>Profit/Loss Analysis</CardTitle>
            <CardDescription>Financial performance overview</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <FileText className="h-8 w-8 text-info mb-2" />
            <CardTitle>Supplier Performance</CardTitle>
            <CardDescription>Evaluate supplier reliability</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <BarChart3 className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Category Analysis</CardTitle>
            <CardDescription>Sales breakdown by medicine category</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Detailed report generation and export features (PDF/Excel) will be available in the next update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            We're working on comprehensive reporting tools that will allow you to:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
            <li>Generate custom date range reports</li>
            <li>Export data to PDF and Excel formats</li>
            <li>Create visual dashboards with interactive charts</li>
            <li>Schedule automated report generation</li>
            <li>Compare performance across different time periods</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
