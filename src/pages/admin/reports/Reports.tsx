
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data for charts
const weeklyData = [
  { name: "Mon", bookings: 12, cancellations: 2 },
  { name: "Tue", bookings: 15, cancellations: 1 },
  { name: "Wed", bookings: 18, cancellations: 3 },
  { name: "Thu", bookings: 14, cancellations: 2 },
  { name: "Fri", bookings: 20, cancellations: 4 },
  { name: "Sat", bookings: 25, cancellations: 2 },
  { name: "Sun", bookings: 22, cancellations: 3 },
];

const monthlyData = [
  { name: "Jan", bookings: 85, cancellations: 12 },
  { name: "Feb", bookings: 90, cancellations: 15 },
  { name: "Mar", bookings: 110, cancellations: 18 },
  { name: "Apr", bookings: 120, cancellations: 14 },
  { name: "May", bookings: 126, cancellations: 20 },
  { name: "Jun", bookings: 135, cancellations: 25 },
  { name: "Jul", bookings: 145, cancellations: 22 },
  { name: "Aug", bookings: 150, cancellations: 17 },
  { name: "Sep", bookings: 140, cancellations: 21 },
  { name: "Oct", bookings: 130, cancellations: 18 },
  { name: "Nov", bookings: 120, cancellations: 15 },
  { name: "Dec", bookings: 115, cancellations: 14 },
];

const pieData = [
  { name: "Completed", value: 72 },
  { name: "Cancelled", value: 12 },
  { name: "No-Show", value: 6 },
  { name: "Rescheduled", value: 10 },
];

const COLORS = ["#0284c7", "#ef4444", "#f59e0b", "#10b981"];

const Reports = () => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("weekly");
  const [dateRange, setDateRange] = useState("current");

  const handleExport = () => {
    toast({
      title: "Report exported",
      description: "Report has been exported to PDF format",
    });
  };

  const chartData = reportType === "weekly" ? weeklyData : monthlyData;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Analyze booking data and performance metrics
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select
            value={reportType}
            onValueChange={setReportType}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={dateRange}
            onValueChange={setDateRange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current {reportType}</SelectItem>
              <SelectItem value="previous">Previous {reportType}</SelectItem>
              <SelectItem value="last3">Last 3 {reportType === "weekly" ? "weeks" : "months"}</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleExport} className="gap-2" variant="outline">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {reportType === "weekly" ? "126" : "1,372"}
            </div>
            <div className="text-xs text-green-500 font-medium mt-2">
              +15% from previous {reportType}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cancellation Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {reportType === "weekly" ? "8.7%" : "12.3%"}
            </div>
            <div className="text-xs text-red-500 font-medium mt-2">
              +2.1% from previous {reportType}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {reportType === "weekly" ? "$6,840" : "$68,600"}
            </div>
            <div className="text-xs text-green-500 font-medium mt-2">
              +12% from previous {reportType}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Booking & Cancellation Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Bookings & Cancellations</CardTitle>
            <CardDescription>
              {reportType === "weekly"
                ? "Daily bookings and cancellations for the current week"
                : "Monthly bookings and cancellations for the year"}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#0284c7" name="Bookings" />
                <Bar
                  dataKey="cancellations"
                  fill="#ef4444"
                  name="Cancellations"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Booking Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Status Distribution</CardTitle>
            <CardDescription>
              Summary of booking outcomes
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((entry, index) => (
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{reportType === "weekly" ? "Weekly" : "Monthly"} Report Details</CardTitle>
          <CardDescription>
            Comprehensive breakdown of all bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cancellations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border">
                {chartData.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.bookings}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.cancellations}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      ${(item.bookings * 50).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <FileText className="h-4 w-4" />
              <span>Export Full Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
