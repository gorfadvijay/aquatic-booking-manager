import React, { useState, useEffect } from "react";
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
import { supabase } from "@/lib/supabase";
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

const COLORS = ["#0284c7", "#ef4444", "#f59e0b", "#10b981"];

const Reports = () => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<"weekly" | "monthly" | "customer">("weekly");
  const [dateRange, setDateRange] = useState<"current" | "previous" | "last3">("current");
  const [bookingData, setBookingData] = useState<any[]>([]);
  const [bookingStats, setBookingStats] = useState({
    totalBookings: 0,
  });
  const [pieData, setPieData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      
      // Format dates for Supabase query
      const startDateISO = startDate.toISOString();
      const endDateISO = endDate.toISOString();
      
      console.log(`Fetching bookings from ${startDateISO} to ${endDateISO}`);
      
      // Fetch bookings from Supabase directly
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .gte('booking_date', startDateISO.split('T')[0])
        .lte('booking_date', endDateISO.split('T')[0]);
      
      if (error) throw error;
      
      console.log(`Fetched ${bookings?.length || 0} bookings`);
      
      // Transform the data for the charts
      const transformedBookingData = transformBookingData(bookings || []);
      
      // Set the chart data
      setBookingData(transformedBookingData);
      
      // Set booking stats - just get the total count
      setBookingStats({
        totalBookings: bookings?.length || 0,
      });
      
      // Count bookings by status
      const statusCounts = countBookingsByStatus(bookings || []);
      
      // Create pie chart data
      setPieData([
        { name: "Completed", value: statusCounts.completed || 0 },
        { name: "Cancelled", value: statusCounts.cancelled || 0 },
        { name: "No-Show", value: statusCounts.noShow || 0 },
        { name: "Pending", value: statusCounts.pending || 0 },
      ]);
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast({
        title: "Failed to load report data",
        description: "Please try again later",
        variant: "destructive",
      });
      
      // Set default mock data for development
      setDefaultMockData();
    } finally {
      setLoading(false);
    }
  };
  
  // Count bookings by status
  const countBookingsByStatus = (bookings: any[]) => {
    const counts = {
      completed: 0,
      cancelled: 0,
      noShow: 0,
      pending: 0
    };
    
    bookings.forEach(booking => {
      if (booking.status === 'completed') counts.completed++;
      else if (booking.status === 'cancelled') counts.cancelled++;
      else if (booking.status === 'no-show') counts.noShow++;
      else counts.pending++; // Default to pending if no status or unknown status
    });
    
    return counts;
  };
  
  // Function to transform booking data for charts
  const transformBookingData = (bookings: any[]): any[] => {
    if (reportType === "weekly") {
      // Group bookings by day of week
      const dayMap = {
        0: "Sun",
        1: "Mon", 
        2: "Tue", 
        3: "Wed", 
        4: "Thu", 
        5: "Fri", 
        6: "Sat"
      };
      
      // Initialize counts for each day
      const dayCounts = {
        "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0
      };
      
      // Count bookings by day
      bookings.forEach(booking => {
        const bookingDate = new Date(booking.booking_date);
        const dayOfWeek = dayMap[bookingDate.getDay() as keyof typeof dayMap];
        if (dayOfWeek) dayCounts[dayOfWeek as keyof typeof dayCounts]++;
      });
      
      // Convert to array format for chart
      return Object.entries(dayCounts).map(([name, bookings]) => ({
        name,
        bookings
      }));
    } else {
      // Group bookings by month
      const monthMap = {
        0: "Jan", 1: "Feb", 2: "Mar", 3: "Apr", 4: "May", 5: "Jun",
        6: "Jul", 7: "Aug", 8: "Sep", 9: "Oct", 10: "Nov", 11: "Dec"
      };
      
      // Initialize counts for each month
      const monthCounts = {
        "Jan": 0, "Feb": 0, "Mar": 0, "Apr": 0, "May": 0, "Jun": 0,
        "Jul": 0, "Aug": 0, "Sep": 0, "Oct": 0, "Nov": 0, "Dec": 0
      };
      
      // Count bookings by month
      bookings.forEach(booking => {
        const bookingDate = new Date(booking.booking_date);
        const month = monthMap[bookingDate.getMonth() as keyof typeof monthMap];
        if (month) monthCounts[month as keyof typeof monthCounts]++;
      });
      
      // Convert to array format for chart
      return Object.entries(monthCounts).map(([name, bookings]) => ({
        name,
        bookings
      }));
    }
  };
  
  // Function to determine date range based on selected options
  const getDateRange = () => {
    const today = new Date();
    let startDate: Date, endDate: Date;
    
    if (reportType === "weekly") {
      if (dateRange === "current") {
        startDate = startOfWeek(today);
        endDate = endOfWeek(today);
      } else if (dateRange === "previous") {
        startDate = startOfWeek(subDays(today, 7));
        endDate = endOfWeek(subDays(today, 7));
      } else { // last3
        startDate = startOfWeek(subDays(today, 21));
        endDate = endOfWeek(today);
      }
    } else { // monthly
      if (dateRange === "current") {
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
      } else if (dateRange === "previous") {
        startDate = startOfMonth(subMonths(today, 1));
        endDate = endOfMonth(subMonths(today, 1));
      } else { // last3
        startDate = startOfMonth(subMonths(today, 2));
        endDate = endOfMonth(today);
      }
    }
    
    return { startDate, endDate };
  };

  // Set default mock data for development
  const setDefaultMockData = () => {
    setBookingData(reportType === "weekly" ? weeklyData : monthlyData);
    setBookingStats({
      totalBookings: reportType === "weekly" ? 126 : 1372,
    });
    setPieData([
      { name: "Completed", value: 72 },
      { name: "Cancelled", value: 12 },
      { name: "No-Show", value: 6 },
      { name: "Pending", value: 10 },
    ]);
  };

  const handleExport = () => {
    toast({
      title: "Report exported",
      description: "Report has been exported to PDF format",
    });
  };

  // Mock data for charts
  const weeklyData = [
    { name: "Mon", bookings: 12 },
    { name: "Tue", bookings: 15 },
    { name: "Wed", bookings: 18 },
    { name: "Thu", bookings: 14 },
    { name: "Fri", bookings: 20 },
    { name: "Sat", bookings: 25 },
    { name: "Sun", bookings: 22 },
  ];

  const monthlyData = [
    { name: "Jan", bookings: 85 },
    { name: "Feb", bookings: 90 },
    { name: "Mar", bookings: 110 },
    { name: "Apr", bookings: 120 },
    { name: "May", bookings: 126 },
    { name: "Jun", bookings: 135 },
    { name: "Jul", bookings: 145 },
    { name: "Aug", bookings: 150 },
    { name: "Sep", bookings: 140 },
    { name: "Oct", bookings: 130 },
    { name: "Nov", bookings: 120 },
    { name: "Dec", bookings: 115 },
  ];

  const chartData = loading ? [] : bookingData;

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
            onValueChange={(value: "weekly" | "monthly" | "customer") => setReportType(value)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="customer">Customer Analysis</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={dateRange}
            onValueChange={(value: "current" | "previous" | "last3") => setDateRange(value)}
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

      <div className="grid gap-6 md:grid-cols-1 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? "..." : bookingStats.totalBookings}
            </div>
          
          </CardContent>
        </Card>
      </div>

      {reportType !== "customer" ? (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Booking Chart */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Bookings</CardTitle>
              <CardDescription>
                {reportType === "weekly"
                  ? "Daily bookings for the current week"
                  : "Monthly bookings for the year"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {loading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Loading chart data...
                </div>
              ) : (
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
                  </BarChart>
                </ResponsiveContainer>
              )}
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
              {loading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Loading chart data...
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer Demographics</CardTitle>
              <CardDescription>
                Analysis of customer age groups and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { age: "18-24", count: 42, rate: 82 },
                    { age: "25-34", count: 68, rate: 86 },
                    { age: "35-44", count: 35, rate: 90 },
                    { age: "45-54", count: 22, rate: 94 },
                    { age: "55+", count: 15, rate: 78 },
                  ]}
                  margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="age" />
                  <YAxis yAxisId="left" orientation="left" stroke="#0284c7" />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" name="Number of Customers" fill="#0284c7" />
                  <Bar yAxisId="right" dataKey="rate" name="Return Rate (%)" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Customer Loyalty</CardTitle>
              <CardDescription>
                Repeat booking statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "One-time", value: 45 },
                      { name: "2-4 bookings", value: 30 },
                      { name: "5-10 bookings", value: 15 },
                      { name: "10+ bookings", value: 10 },
                    ]}
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
                    {[
                      "#0284c7",
                      "#10b981",
                      "#eab308",
                      "#f97316",
                    ].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>
                Customers with the most bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Total Bookings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Last Booking
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border">
                    {[
                      { name: "John Smith", email: "john@example.com", bookings: 12, last: "2025-05-14", status: "Active" },
                      { name: "Emma Wilson", email: "emma@example.com", bookings: 8, last: "2025-05-12", status: "Active" },
                      { name: "Michael Brown", email: "michael@example.com", bookings: 7, last: "2025-05-10", status: "Active" },
                      { name: "Sarah Johnson", email: "sarah@example.com", bookings: 6, last: "2025-04-28", status: "Inactive" },
                      { name: "David Lee", email: "david@example.com", bookings: 5, last: "2025-04-15", status: "Inactive" },
                    ].map((customer, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">{customer.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {customer.bookings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {customer.last}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            customer.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {customer.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{reportType === "weekly" ? "Weekly" : reportType === "monthly" ? "Monthly" : "Customer Analysis"} Report Details</CardTitle>
          <CardDescription>
            Comprehensive breakdown of all bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading report details...
            </div>
          ) : (
            <>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
