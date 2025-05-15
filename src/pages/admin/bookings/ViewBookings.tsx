import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CalendarCheck,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  FileText,
  Mail,
  MoreHorizontal,
  User,
  Clock,
  Phone,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  UserService, 
  getAllBookings, 
  getBookingsByDate, 
  getUserBookings, 
  cancelBooking,
  rescheduleBooking,
  SlotService,
  sendNotification
} from "@/lib/db";
import { Booking } from "@/types/schema";
import { format, addDays, subDays, parseISO } from "date-fns";

interface EnrichedBooking extends Booking {
  customerName?: string;
  email?: string;
  phone?: string;
  age?: number;
}

const ViewBookings = () => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduledDate, setRescheduledDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [rescheduledTime, setRescheduledTime] = useState<string>("9:00");

  // Format the currently selected date for display
  const formattedDate = format(selectedDate, "EEEE, MMMM d, yyyy");

  // Fetch bookings data on component mount and when selected date changes
  useEffect(() => {
    fetchBookings();
  }, [selectedDate, viewMode]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let fetchedBookings: Booking[] = [];
      const formattedSelectedDate = format(selectedDate, "yyyy-MM-dd");
      
      // Fetch bookings based on view mode
      if (viewMode === "day") {
        // Fetch bookings for the specific day
        fetchedBookings = await getBookingsByDate(formattedSelectedDate);
      } else if (viewMode === "week") {
        // Fetch bookings for the entire week
        const promises = [];
        for (let i = 0; i < 7; i++) {
          const date = format(addDays(selectedDate, i - 3), "yyyy-MM-dd"); // -3 to +3 around the selected date
          promises.push(getBookingsByDate(date));
        }
        const results = await Promise.all(promises);
        fetchedBookings = results.flat();
      } else {
        // For month view, just get all bookings
        // In a real app, you would filter by month
        fetchedBookings = await getAllBookings();
        
        // Filter to only show the current month
        fetchedBookings = fetchedBookings.filter(booking => {
          const bookingDate = typeof booking.booking_date === 'string' 
            ? booking.booking_date 
            : format(new Date(booking.booking_date), "yyyy-MM-dd");
          return bookingDate.substring(0, 7) === format(selectedDate, "yyyy-MM");
        });
      }

      // Fetch all users for enriching booking data
      const users = await UserService.getAll();
      const userMap = users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>);
      
      // Enrich bookings with user data
      const enrichedBookings = fetchedBookings.map(booking => {
        const user = userMap[booking.user_id];
        
        // Calculate age if DOB is available
        let age;
        if (user && user.dob) {
          const dob = new Date(user.dob);
          const today = new Date();
          age = today.getFullYear() - dob.getFullYear();
          const monthDiff = today.getMonth() - dob.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
          }
        }
        
        return {
          ...booking,
          customerName: user ? user.name : "Unknown Customer",
          email: user ? user.email : "unknown@example.com",
          phone: user ? user.phone : "Unknown Phone",
          age: age || "N/A"
        };
      });
      
      // Sort bookings by date and time
      enrichedBookings.sort((a, b) => {
        // First sort by date
        const dateA = new Date(a.booking_date).getTime();
        const dateB = new Date(b.booking_date).getTime();
        if (dateA !== dateB) return dateA - dateB;
        
        // Then by start time
        const [hoursA, minutesA] = a.start_time.split(':').map(Number);
        const [hoursB, minutesB] = b.start_time.split(':').map(Number);
        
        const timeA = hoursA * 60 + minutesA;
        const timeB = hoursB * 60 + minutesB;
        
        return timeA - timeB;
      });
      
      setBookings(enrichedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error loading bookings",
        description: "Could not load booking data. Please try again later.",
        variant: "destructive",
      });
      
      // Set empty bookings array
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleCancelBooking = async () => {
    if (!cancelBookingId) return;
    
    try {
      await cancelBooking(cancelBookingId, "Cancelled by admin");
      
      toast({
        title: "Booking cancelled",
        description: "Customer has been notified and refund has been initiated.",
      });
      
      // Refresh bookings
      fetchBookings();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancelBookingId(null);
    }
  };

  const handleRescheduleBooking = async () => {
    if (!rescheduleBookingId) return;
    
    try {
      await rescheduleBooking(
        rescheduleBookingId,
        rescheduledDate,
        rescheduledTime,
        calculateEndTime(rescheduledTime)
      );
      
      toast({
        title: "Booking rescheduled",
        description: "Customer has been notified about the new booking time.",
      });
      
      // Refresh bookings
      fetchBookings();
    } catch (error) {
      console.error("Error rescheduling booking:", error);
      toast({
        title: "Error",
        description: "Failed to reschedule booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRescheduleBookingId(null);
    }
  };
  
  // Calculate end time based on start time (assuming 1-hour slots)
  const calculateEndTime = (startTime: string): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + 1;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleGenerateInvoice = async (bookingId: string) => {
    try {
      // In a real app, this would call an API to generate an invoice
      toast({
        title: "Invoice generated",
        description: "Invoice has been generated and sent to the customer.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate invoice.",
        variant: "destructive",
      });
    }
  };
  
  const handleSendReminder = async (booking: any) => {
    try {
      // Send a reminder notification
      await sendNotification(
        booking.user_id,
        'email',
        'reminder',
        `Reminder: You have a swimming analysis session scheduled for ${booking.booking_date} at ${booking.start_time}.`
      );
      
      toast({
        title: "Email sent",
        description: "Reminder email sent to customer.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reminder.",
        variant: "destructive",
      });
    }
  };
  
  const handleViewCustomerDetails = (booking: any) => {
    // In a real app, this might open a modal with customer details
    toast({
      title: "Customer Details",
      description: `Name: ${booking.customerName}, Email: ${booking.email}, Phone: ${booking.phone}`,
    });
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Bookings Calendar</h1>
        <p className="text-muted-foreground">
          View and manage all swimming analysis bookings
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevious}
                className="h-9 w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="mx-4 text-lg font-semibold">{formattedDate}</div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="h-9 w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">View:</span>
                <Select
                  value={viewMode}
                  onValueChange={(value) => setViewMode(value as any)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" className="gap-2" onClick={handleToday}>
                <Calendar className="h-4 w-4" />
                <span>Today</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
          <CardDescription>
            {viewMode === "day"
              ? "All bookings for the selected day"
              : viewMode === "week"
              ? "Weekly view of bookings"
              : "Monthly overview of bookings"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">
              <p>Loading bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No bookings found</h3>
              <p className="text-muted-foreground">
                There are no bookings scheduled for this {viewMode === "day" ? "day" : viewMode === "week" ? "week" : "month"}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking: any) => (
                <div
                  key={booking.id}
                  className="flex flex-col md:flex-row md:items-center justify-between border rounded-lg p-4 mb-4 hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary p-2 rounded-full">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium flex items-center">
                        {booking.customerName}
                        {booking.status === "completed" && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Completed</span>
                        )}
                        {booking.rescheduled_to && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Rescheduled</span>
                        )}
                        {booking.cancel_reason && (
                          <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Cancelled</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(booking.booking_date), "MMM dd, yyyy")}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {booking.start_time} - {booking.end_time}
                        </span>
                    
                      
                        {booking.age !== "N/A" && (
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            Age: {booking.age}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => handleGenerateInvoice(booking.id)}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Invoice</span>
                    </Button>
                    
             

                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Booking Dialog */}
      <AlertDialog
        open={cancelBookingId !== null}
        onOpenChange={() => setCancelBookingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the booking and initiate a refund process. An email notification 
              will be sent to the customer. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule Booking Dialog */}
      <AlertDialog
        open={rescheduleBookingId !== null}
        onOpenChange={() => setRescheduleBookingId(null)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Reschedule Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Select a new date and time for this booking. The customer will be notified of the change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">New Date</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border border-border rounded-md"
                value={rescheduledDate}
                onChange={(e) => setRescheduledDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Time</label>
              <Select 
                defaultValue="9:00"
                value={rescheduledTime}
                onValueChange={setRescheduledTime}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9:00">9:00 AM - 10:00 AM</SelectItem>
                  <SelectItem value="10:00">10:00 AM - 11:00 AM</SelectItem>
                  <SelectItem value="11:00">11:00 AM - 12:00 PM</SelectItem>
                  <SelectItem value="12:00">12:00 PM - 1:00 PM</SelectItem>
                  <SelectItem value="13:00">1:00 PM - 2:00 PM</SelectItem>
                  <SelectItem value="14:00">2:00 PM - 3:00 PM</SelectItem>
                  <SelectItem value="15:00">3:00 PM - 4:00 PM</SelectItem>
                  <SelectItem value="16:00">4:00 PM - 5:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRescheduleBooking}>
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ViewBookings;
