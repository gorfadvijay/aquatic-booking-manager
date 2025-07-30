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
import { Download, FileText, Calendar, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { getFirstBookingDate } from "@/lib/utils";

const COLORS = ["#0284c7", "#ef4444", "#f59e0b", "#10b981"];

const Reports = () => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const [dateRange, setDateRange] = useState<"current" | "previous" | "last3">("current");
  const [bookingData, setBookingData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [bookingStats, setBookingStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
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
      const { data: allBookings, error } = await supabase
        .from('slotbooking')
        .select('*');
      
      if (error) throw error;
      
      console.log(`Fetched ${allBookings?.length || 0} total bookings`);
      
      // Filter bookings by date range from booking_dates JSON array
      const startDateStr = startDateISO.split('T')[0];
      const endDateStr = endDateISO.split('T')[0];
      
      const bookings = allBookings?.filter(booking => {
        if (!booking.booking_dates) return false;
        
        try {
          const bookingDates = typeof booking.booking_dates === 'string' 
            ? JSON.parse(booking.booking_dates) 
            : booking.booking_dates;
            
          if (!Array.isArray(bookingDates)) return false;
          
          // Check if any booking date falls within the selected range
          return bookingDates.some(date => 
            date >= startDateStr && date <= endDateStr
          );
        } catch (error) {
          console.error('Error parsing booking_dates:', error);
          return false;
        }
      }) || [];
      
      console.log(`Filtered to ${bookings.length} bookings in date range`);
      
      // Transform the data for the charts
      const transformedBookingData = transformBookingData(bookings);
      
      // Set the raw bookings and chart data
      setBookingData(bookings);
      setChartData(transformedBookingData);
      
      // Calculate stats
      const totalRevenue = bookings?.reduce((sum, booking) => {
        // Convert amount from smallest currency unit (paisa) to rupees
        const amount = booking.amount ? booking.amount / 100 : 0;
        return sum + amount;
      }, 0) || 0;
      
      setBookingStats({
        totalBookings: bookings?.length || 0,
        totalRevenue: Math.round(totalRevenue),
      });
      
      // Count bookings by status
      const statusCounts = countBookingsByStatus(bookings || []);
      
      // Create pie chart data
      setPieData([
        { name: "Successful", value: statusCounts.completed || 0 },
        { name: "Failed", value: statusCounts.cancelled || 0 },
        { name: "Refunded", value: statusCounts.noShow || 0 },
        { name: "Pending", value: statusCounts.pending || 0 },
      ]);
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast({
        title: "Failed to load report data",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Count bookings by payment status
  const countBookingsByStatus = (bookings: any[]) => {
    const counts = {
      completed: 0,
      cancelled: 0,
      noShow: 0,
      pending: 0
    };
    
    bookings.forEach(booking => {
      if (booking.payment_status === 'success') counts.completed++;
      else if (booking.payment_status === 'failed') counts.cancelled++;
      else if (booking.payment_status === 'refunded') counts.noShow++;
      else counts.pending++; // Default to pending for unknown or pending payment status
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
      
      // Count bookings by day - count for every day the booking spans
      bookings.forEach(booking => {
        try {
          // Parse all booking dates from the JSON array
          const bookingDates = typeof booking.booking_dates === 'string' 
            ? JSON.parse(booking.booking_dates) 
            : booking.booking_dates;
            
          if (Array.isArray(bookingDates)) {
            // Track which days we've already counted for this booking
            const countedDays = new Set();
            
            bookingDates.forEach(dateStr => {
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                const dayOfWeek = dayMap[date.getDay() as keyof typeof dayMap];
                // Only count once per day per booking
                if (dayOfWeek && !countedDays.has(dayOfWeek)) {
                  dayCounts[dayOfWeek as keyof typeof dayCounts]++;
                  countedDays.add(dayOfWeek);
                }
              }
            });
          } else {
            // Fallback to first booking date if booking_dates is not an array
            const bookingDate = getFirstBookingDate(booking);
            if (bookingDate) {
              const dayOfWeek = dayMap[bookingDate.getDay() as keyof typeof dayMap];
              if (dayOfWeek) dayCounts[dayOfWeek as keyof typeof dayCounts]++;
            }
          }
        } catch (error) {
          console.error('Error parsing booking dates for weekly chart:', error);
          // Fallback to first booking date
          const bookingDate = getFirstBookingDate(booking);
          if (bookingDate) {
        const dayOfWeek = dayMap[bookingDate.getDay() as keyof typeof dayMap];
        if (dayOfWeek) dayCounts[dayOfWeek as keyof typeof dayCounts]++;
          }
        }
      });
      
      // Convert to array format for chart - only show days with bookings
      return Object.entries(dayCounts)
        .filter(([name, bookings]) => bookings > 0)
        .map(([name, bookings]) => ({
        name,
        bookings
      }));
    } else if (reportType === "monthly") {
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
      
      // Count bookings by month - count for every month the booking spans
      bookings.forEach(booking => {
        try {
          // Parse all booking dates from the JSON array
          const bookingDates = typeof booking.booking_dates === 'string' 
            ? JSON.parse(booking.booking_dates) 
            : booking.booking_dates;
            
          if (Array.isArray(bookingDates)) {
            // Track which months we've already counted for this booking
            const countedMonths = new Set();
            
            bookingDates.forEach(dateStr => {
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                const month = monthMap[date.getMonth() as keyof typeof monthMap];
                // Only count once per month per booking
                if (month && !countedMonths.has(month)) {
                  monthCounts[month as keyof typeof monthCounts]++;
                  countedMonths.add(month);
                }
              }
            });
          } else {
            // Fallback to first booking date if booking_dates is not an array
            const bookingDate = getFirstBookingDate(booking);
            if (bookingDate) {
              const month = monthMap[bookingDate.getMonth() as keyof typeof monthMap];
              if (month) monthCounts[month as keyof typeof monthCounts]++;
            }
          }
        } catch (error) {
          console.error('Error parsing booking dates for monthly chart:', error);
          // Fallback to first booking date
          const bookingDate = getFirstBookingDate(booking);
          if (bookingDate) {
        const month = monthMap[bookingDate.getMonth() as keyof typeof monthMap];
        if (month) monthCounts[month as keyof typeof monthCounts]++;
          }
        }
      });
      
      // Convert to array format for chart - only show months with bookings
      return Object.entries(monthCounts)
        .filter(([name, bookings]) => bookings > 0)
        .map(([name, bookings]) => ({
          name,
          bookings
        }));
    } else {
      // Group bookings by year
      const yearCounts: { [key: string]: number } = {};
      
      // Count bookings by year - count for every year the booking spans
      bookings.forEach(booking => {
        try {
          // Parse all booking dates from the JSON array
          const bookingDates = typeof booking.booking_dates === 'string' 
            ? JSON.parse(booking.booking_dates) 
            : booking.booking_dates;
            
          if (Array.isArray(bookingDates)) {
            // Track which years we've already counted for this booking
            const countedYears = new Set();
            
            bookingDates.forEach(dateStr => {
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                const year = date.getFullYear().toString();
                // Only count once per year per booking
                if (!countedYears.has(year)) {
                  yearCounts[year] = (yearCounts[year] || 0) + 1;
                  countedYears.add(year);
                }
              }
            });
          } else {
            // Fallback to first booking date if booking_dates is not an array
            const bookingDate = getFirstBookingDate(booking);
            if (bookingDate) {
              const year = bookingDate.getFullYear().toString();
              yearCounts[year] = (yearCounts[year] || 0) + 1;
            }
          }
        } catch (error) {
          console.error('Error parsing booking dates for yearly chart:', error);
          // Fallback to first booking date
          const bookingDate = getFirstBookingDate(booking);
          if (bookingDate) {
            const year = bookingDate.getFullYear().toString();
            yearCounts[year] = (yearCounts[year] || 0) + 1;
          }
        }
      });
      
      // Convert to array format for chart and sort by year
      return Object.entries(yearCounts)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([name, bookings]) => ({
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
    } else if (reportType === "monthly") {
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
    } else { // yearly
      if (dateRange === "current") {
        startDate = new Date(today.getFullYear(), 0, 1); // January 1st of current year
        endDate = new Date(today.getFullYear(), 11, 31); // December 31st of current year
      } else if (dateRange === "previous") {
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
      } else { // last3
        startDate = new Date(today.getFullYear() - 2, 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
      }
    }
    
    return { startDate, endDate };
  };



  const handleExport = () => {
    toast({
      title: "Report exported",
      description: "Report has been exported to PDF format",
    });
  };





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
            onValueChange={(value: "weekly" | "monthly" | "yearly") => setReportType(value)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
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

      <div className="grid gap-6 md:grid-cols-2 mb-6">
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
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? "..." : `₹${bookingStats.totalRevenue.toLocaleString()}`}
            </div>
          </CardContent>
        </Card>
      </div>


        <div className="grid gap-6 md:grid-cols-3">
          {/* Booking Chart */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Bookings</CardTitle>
              <CardDescription>
                {reportType === "weekly"
                  ? "Daily bookings for the current week"
                  : reportType === "monthly" 
                    ? "Monthly bookings for the year"
                    : "Yearly booking trends"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {loading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Loading chart data...
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No booking data available for the selected period</p>
                  </div>
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

         
        </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{reportType === "weekly" ? "Weekly" : reportType === "monthly" ? "Monthly" : "Yearly"} Report Details</CardTitle>
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
