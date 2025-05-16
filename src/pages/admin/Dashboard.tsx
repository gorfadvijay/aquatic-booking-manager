import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, FileText, Users, Loader2 } from "lucide-react";
import { getAllBookings, getBookingsByDate } from "@/lib/services/api/booking-api.service";
import { UserService } from "@/lib/services/user.service";
import { format } from "date-fns";
import { Booking, User } from "@/types/schema";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [todaysBookings, setTodaysBookings] = useState<Booking[]>([]);
  const [userMap, setUserMap] = useState<Record<string, User>>({});
  const [stats, setStats] = useState({
    totalBookings: 0,
    registeredCustomers: 0,
    revenue: 0
  });

  // Fetch all necessary data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get all bookings
        const allBookings = await getAllBookings();
        setBookings(allBookings);

        // Get today's bookings
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayBookings = await getBookingsByDate(today);
        setTodaysBookings(todayBookings);

        // Get all users
        const users = await UserService.getAll();
        
        // Create a map of user IDs to user objects for quick lookup
        const userLookup: Record<string, User> = {};
        users.forEach(user => {
          userLookup[user.id] = user;
        });
        setUserMap(userLookup);

        // Calculate statistics
        setStats({
          totalBookings: allBookings.length,
          registeredCustomers: users.filter(u => !u.is_admin).length,
          revenue: allBookings.length * 60 // Assuming $60 per booking for demo
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get status for a booking
  const getBookingStatus = (booking: Booking) => {
    const now = new Date();
    const bookingDate = new Date(booking.booking_date);
    const startTime = booking.start_time.split(':');
    const endTime = booking.end_time.split(':');
    
    const startDateTime = new Date(bookingDate);
    startDateTime.setHours(parseInt(startTime[0]), parseInt(startTime[1]), 0);
    
    const endDateTime = new Date(bookingDate);
    endDateTime.setHours(parseInt(endTime[0]), parseInt(endTime[1]), 0);
    
    if (now < startDateTime) {
      return "Upcoming";
    } else if (now >= startDateTime && now <= endDateTime) {
      return "In Progress";
    } else {
      return "Completed";
    }
  };

  // Format time from 24h to 12h
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${period}`;
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back to your pool management dashboard.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading dashboard data...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{stats.totalBookings}</div>
                  <div className="bg-primary/10 text-primary p-2 rounded">
                    <Calendar className="h-5 w-5" />
                  </div>
                </div>
               
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Registered Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{stats.registeredCustomers}</div>
                  <div className="bg-primary/10 text-primary p-2 rounded">
                    <Users className="h-5 w-5" />
                  </div>
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
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">₹ {stats.revenue.toLocaleString()}</div>
                  <div className="bg-primary/10 text-primary p-2 rounded">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
               
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Latest bookings for analysis sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.slice(0, 5).map((booking) => {
                    const user = userMap[booking.user_id];
                    const status = getBookingStatus(booking);
                    
                    return (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between border-b border-border pb-4"
                      >
                        <div>
                          <div className="font-medium">{user?.name || "Unknown Customer"}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(booking.booking_date), 'MMM d, yyyy')} - {formatTime(booking.start_time)}
                          </div>
                        </div>
                        <div className={`text-sm px-2 py-1 rounded-full ${
                          status === "In Progress" 
                            ? "bg-blue-100 text-blue-800" 
                            : status === "Completed" 
                              ? "bg-green-100 text-green-800"
                              : "bg-secondary text-primary"
                        }`}>
                          {status}
                        </div>
                      </div>
                    );
                  })}
                  
                  {bookings.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No bookings found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>Upcoming sessions for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todaysBookings.map((booking) => {
                    const user = userMap[booking.user_id];
                    const status = getBookingStatus(booking);
                    
                    return (
                      <div 
                        key={booking.id}
                        className="flex items-center justify-between border-b border-border pb-4"
                      >
                        <div>
                          <div className="font-medium">
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user?.name || "Unknown Customer"} - Analysis Session
                          </div>
                        </div>
                        <div className={`text-sm px-2 py-1 rounded-full ${
                          status === "In Progress" 
                            ? "bg-blue-100 text-blue-800" 
                            : status === "Completed" 
                              ? "bg-green-100 text-green-800"
                              : "bg-secondary text-primary"
                        }`}>
                          {status}
                        </div>
                      </div>
                    );
                  })}
                  
                  {todaysBookings.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No sessions scheduled for today
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
