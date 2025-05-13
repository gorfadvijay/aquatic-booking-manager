
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
  getBookingsByDate, 
  cancelBooking, 
  rescheduleBooking, 
  sendNotification, 
  getAllBookings, 
  UserService 
} from "@/lib/api";
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
      // In a real implementation, we would fetch bookings for the selected date range
      // based on the view mode (day, week, month)
      
      // For this demo, we'll fetch all bookings and filter them
      const allBookings = await getAllBookings();
      
      // For demonstration purposes, we'll just return some mock data
      // that is "associated" with the current selected date
      
      // Modify this when connecting to the real API
      const formattedSelectedDate = format(selectedDate, "yyyy-MM-dd");
      
      // Add user details to bookings for display purposes
      const enrichedBookings = allBookings
        .filter(booking => {
          // Filter based on view mode and selected date
          const bookingDate = typeof booking.booking_date === 'string' 
            ? parseISO(booking.booking_date) 
            : booking.booking_date;
            
          if (viewMode === "day") {
            return format(bookingDate, "yyyy-MM-dd") === formattedSelectedDate;
          } else if (viewMode === "week") {
            // Filter for the entire week
            // This is a simplified version, you might want to use the proper week range
            return Math.abs(Number(bookingDate) - Number(selectedDate)) <= 7 * 24 * 60 * 60 * 1000;
          } else {
            // Filter for the entire month
            return format(bookingDate, "yyyy-MM") === format(selectedDate, "yyyy-MM");
          }
        })
        .map(booking => {
          // Get user details for each booking
          const user = UserService.getById(booking.user_id);
          return {
            ...booking,
            customerName: user ? user.name : "Unknown Customer",
            email: user ? user.email : "unknown@example.com",
            phone: user ? user.phone : "Unknown Phone",
            age: 28 // Mock age, in a real app this would come from user data or calculated from DOB
          };
        });
      
      setBookings(enrichedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error loading bookings",
        description: "Could not load booking data. Please try again later.",
        variant: "destructive",
      });
      
      // Set mock data for development
      setBookings([
        {
          id: "1",
          user_id: "user1",
          slot_id: "slot1",
          booking_date: format(selectedDate, "yyyy-MM-dd"),
          start_time: "9:00",
          end_time: "10:00",
          status: "booked",
          rescheduled_to: null,
          cancel_reason: null,
          created_at: new Date().toISOString(),
          customerName: "John Smith",
          age: 28,
          email: "john.smith@example.com",
          phone: "+1 (555) 123-4567",
        },
        {
          id: "2",
          user_id: "user2",
          slot_id: "slot1",
          booking_date: format(selectedDate, "yyyy-MM-dd"),
          start_time: "10:00",
          end_time: "11:00",
          status: "booked",
          rescheduled_to: null,
          cancel_reason: null,
          created_at: new Date().toISOString(),
          customerName: "Emma Wilson",
          age: 24,
          email: "emma.w@example.com",
          phone: "+1 (555) 234-5678",
        }
      ] as any);
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
                  className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 pt-2 gap-2"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary p-2 rounded">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{booking.customerName}</div>
                      <div className="text-sm text-muted-foreground">
                        Age: {booking.age} • {booking.start_time} - {booking.end_time} • {format(new Date(booking.booking_date), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2 md:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => handleGenerateInvoice(booking.id)}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Invoice</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => setRescheduleBookingId(booking.id)}
                    >
                      <CalendarCheck className="h-3.5 w-3.5" />
                      <span>Reschedule</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => setCancelBookingId(booking.id)}
                    >
                      <CalendarX className="h-3.5 w-3.5" />
                      <span>Cancel</span>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 bg-transparent"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleSendReminder(booking)}
                          className="flex items-center gap-2"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          <span>Send Reminder</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleViewCustomerDetails(booking)}
                          className="flex items-center gap-2"
                        >
                          <User className="h-3.5 w-3.5" />
                          <span>Customer Details</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
