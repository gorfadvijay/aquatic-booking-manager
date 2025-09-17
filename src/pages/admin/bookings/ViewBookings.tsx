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
  ChevronLeft,
  ChevronRight,
  Mail,
  User,
  Clock,
  Eye,
  Info,
  CreditCard,
  Hash,
  MapPin,
  Phone,
  Activity,
  Shield,
  AlertCircle,
  UserCheck,
  Home,
  Waves,
  MessageCircle,
  GraduationCap,
  Award,
  Timer,
  Globe,
  School,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  getAllBookings,
  getBookingsByDate,
  cancelBooking,
  rescheduleBooking,
  sendNotification
} from "@/lib/db";
import { Booking } from "@/types/schema";
import { format, addDays } from "date-fns";
import { formatBookingDate, formatBookingDatesRange } from "@/lib/utils";

interface EnrichedBooking extends Omit<Booking, 'email' | 'phone'> {
  customerName?: string;
  email?: string;
  phone?: string;
  age?: number | string;
  booking_date?: string;
  slot_type?: string;
  location?: string;
  payment_method?: string;
  notes?: string;
  gender?: string;
  dob?: string;
  address?: string;
  emergency_contact?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  medical_conditions?: string;
  swimming_experience?: string;
  preferred_language?: string;
  occupation?: string;
  nationality?: string;
  blood_group?: string;
  allergies?: string;
  medications?: string;
  previous_injuries?: string;
  fitness_level?: string;
  goals?: string;
  referred_by?: string;
  has_whatsapp?: boolean;
  current_location?: string;
  academy_name?: string;
  coach_name?: string;
  specialization?: string;
  participate_in_events?: string;
  stroke_best_time?: string;
  how_did_you_know?: string;
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
  const [selectedBooking, setSelectedBooking] = useState<EnrichedBooking | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

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
          if (!booking.booking_dates) return false;
          
          try {
            const bookingDates = typeof booking.booking_dates === 'string' 
              ? JSON.parse(booking.booking_dates) 
              : booking.booking_dates;
              
            if (!Array.isArray(bookingDates)) return false;
            
            const selectedMonth = format(selectedDate, "yyyy-MM");
            return bookingDates.some(date => date.substring(0, 7) === selectedMonth);
          } catch (error) {
            console.error('Error parsing booking_dates for month filter:', error);
            return false;
          }
        });
      }

      // Since slotbooking table has user info directly, we don't need to fetch from users table
      const enrichedBookings = fetchedBookings.map(booking => {
        // Extract the first date from booking_dates array for sorting
        let bookingDate = new Date();
        if (booking.booking_dates) {
          try {
            const bookingDates = typeof booking.booking_dates === 'string' 
              ? JSON.parse(booking.booking_dates) 
              : booking.booking_dates;
            if (Array.isArray(bookingDates) && bookingDates.length > 0) {
              bookingDate = new Date(bookingDates[0]);
            }
          } catch (error) {
            console.error('Error parsing booking_dates:', error);
          }
        }
        
        // Parse user_data if it exists
        let userData = null;
        if (booking.user_data) {
          try {
            userData = typeof booking.user_data === 'string'
              ? JSON.parse(booking.user_data)
              : booking.user_data;
          } catch (error) {
            console.error('Error parsing user_data:', error);
          }
        }

        // Calculate age from DOB if available
        let age = "N/A";
        if (userData?.dob) {
          const birthDate = new Date(userData.dob);
          const today = new Date();
          let calculatedAge = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--;
          }
          age = calculatedAge.toString();
        }

        return {
          ...booking,
          customerName: booking.name || userData?.name || "Unknown Customer",
          email: booking.email || userData?.email || "unknown@example.com",
          phone: booking.phone || userData?.phone || "Unknown Phone",
          booking_date: bookingDate.toISOString().split('T')[0],
          age: age,
          user_data: userData // Include parsed user data
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

  const handleViewDetails = (booking: EnrichedBooking) => {
    setSelectedBooking(booking);
    setShowDetailsDialog(true);
  };

  const getStatusBadge = (booking: any) => {
    if (booking.cancel_reason) {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (booking.rescheduled_to) {
      return <Badge variant="secondary">Rescheduled</Badge>;
    }
    if (booking.status === "completed") {
      return <Badge variant="default" className="bg-green-600">Completed</Badge>;
    }
    if (booking.status === "confirmed") {
      return <Badge variant="default" className="bg-blue-600">Confirmed</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  const parseBookingDates = (bookingDates: any) => {
    try {
      const dates = typeof bookingDates === 'string'
        ? JSON.parse(bookingDates)
        : bookingDates;

      if (Array.isArray(dates)) {
        return dates;
      }
      return [];
    } catch (error) {
      console.error('Error parsing booking dates:', error);
      return [];
    }
  };
  
  const handleSendReminder = async (booking: any) => {
    try {
      // Send a reminder notification
      await sendNotification(
        booking.user_id,
        'email',
        'reminder',
                        `Reminder: You have a swimming analysis session scheduled for ${formatBookingDate(booking, 'yyyy-MM-dd')} at ${booking.start_time}.`
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
                          {formatBookingDatesRange(booking)}
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
                      onClick={() => handleViewDetails(booking)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Details</span>
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

      {/* Booking Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Booking Details</DialogTitle>
            <DialogDescription>
              Complete information about this booking
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Status</h3>
                {getStatusBadge(selectedBooking)}
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </h3>

                {/* Basic Information */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Full Name</p>
                        <p className="font-medium">{selectedBooking.customerName || selectedBooking.name || "N/A"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email Address</p>
                        <p className="font-medium text-sm">{selectedBooking.email || "N/A"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone Number</p>
                        <p className="font-medium">{selectedBooking.phone || "N/A"}</p>
                      </div>
                    </div>

                    {(selectedBooking.user_data?.dob || selectedBooking.dob) && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Date of Birth</p>
                          <p className="font-medium">
                            {format(new Date(selectedBooking.user_data?.dob || selectedBooking.dob), "dd MMM yyyy")}
                            {selectedBooking.age && selectedBooking.age !== "N/A" && ` (Age: ${selectedBooking.age})`}
                          </p>
                        </div>
                      </div>
                    )}

                    {(selectedBooking.user_data?.gender || selectedBooking.gender) && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <UserCheck className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Gender</p>
                          <p className="font-medium capitalize">{selectedBooking.user_data?.gender || selectedBooking.gender}</p>
                        </div>
                      </div>
                    )}

                    {(selectedBooking.user_data?.nationality || selectedBooking.nationality) && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Info className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Nationality</p>
                          <p className="font-medium">{selectedBooking.user_data?.nationality || selectedBooking.nationality}</p>
                        </div>
                      </div>
                    )}

                    {(selectedBooking.user_data?.occupation || selectedBooking.occupation) && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Info className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Occupation</p>
                          <p className="font-medium">{selectedBooking.user_data?.occupation || selectedBooking.occupation}</p>
                        </div>
                      </div>
                    )}

                    {(selectedBooking.user_data?.preferred_language || selectedBooking.preferred_language) && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Globe className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Preferred Language</p>
                          <p className="font-medium">{selectedBooking.user_data?.preferred_language || selectedBooking.preferred_language}</p>
                        </div>
                      </div>
                    )}

                    {(selectedBooking.user_data?.current_location || selectedBooking.current_location) && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Current Location</p>
                          <p className="font-medium">{selectedBooking.user_data?.current_location || selectedBooking.current_location}</p>
                        </div>
                      </div>
                    )}

                    {(selectedBooking.user_data?.has_whatsapp !== undefined || selectedBooking.has_whatsapp !== undefined) && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <MessageCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">WhatsApp Available</p>
                          <p className="font-medium">{(selectedBooking.user_data?.has_whatsapp || selectedBooking.has_whatsapp) ? "Yes" : "No"}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                {(selectedBooking.user_data?.address || selectedBooking.address) && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Contact Details</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Home className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Full Address</p>
                          <p className="font-medium">{selectedBooking.user_data?.address || selectedBooking.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Emergency Contact */}
                {(selectedBooking.user_data?.emergency_contact || selectedBooking.emergency_contact) && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Emergency Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                          <Phone className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Emergency Number</p>
                          <p className="font-medium">{selectedBooking.user_data?.emergency_contact || selectedBooking.emergency_contact}</p>
                        </div>
                      </div>
                      {(selectedBooking.user_data?.emergency_contact_name || selectedBooking.emergency_contact_name) && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-full">
                            <User className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Contact Name</p>
                            <p className="font-medium">{selectedBooking.user_data?.emergency_contact_name || selectedBooking.emergency_contact_name}</p>
                          </div>
                        </div>
                      )}
                      {(selectedBooking.user_data?.emergency_contact_relation || selectedBooking.emergency_contact_relation) && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-full">
                            <Info className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Relationship</p>
                            <p className="font-medium">{selectedBooking.user_data?.emergency_contact_relation || selectedBooking.emergency_contact_relation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Swimming & Training Information */}
                {(selectedBooking.user_data?.swimming_experience || selectedBooking.swimming_experience ||
                  selectedBooking.user_data?.specialization || selectedBooking.specialization ||
                  selectedBooking.user_data?.academy_name || selectedBooking.academy_name ||
                  selectedBooking.user_data?.coach_name || selectedBooking.coach_name ||
                  selectedBooking.user_data?.participate_in_events || selectedBooking.participate_in_events ||
                  selectedBooking.user_data?.stroke_best_time || selectedBooking.stroke_best_time ||
                  selectedBooking.user_data?.fitness_level || selectedBooking.fitness_level ||
                  selectedBooking.user_data?.goals || selectedBooking.goals) && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Swimming & Training Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(selectedBooking.user_data?.swimming_experience || selectedBooking.swimming_experience) && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Waves className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Swimming Experience</p>
                            <p className="font-medium capitalize">{selectedBooking.user_data?.swimming_experience || selectedBooking.swimming_experience}</p>
                          </div>
                        </div>
                      )}
                      {(selectedBooking.user_data?.specialization || selectedBooking.specialization) && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Award className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Specialization</p>
                            <p className="font-medium capitalize">{selectedBooking.user_data?.specialization || selectedBooking.specialization}</p>
                          </div>
                        </div>
                      )}
                      {(selectedBooking.user_data?.academy_name || selectedBooking.academy_name) && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <School className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Academy Name</p>
                            <p className="font-medium">{selectedBooking.user_data?.academy_name || selectedBooking.academy_name}</p>
                          </div>
                        </div>
                      )}
                      {(selectedBooking.user_data?.coach_name || selectedBooking.coach_name) && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <GraduationCap className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Coach Name</p>
                            <p className="font-medium">{selectedBooking.user_data?.coach_name || selectedBooking.coach_name}</p>
                          </div>
                        </div>
                      )}
                      {(selectedBooking.user_data?.participate_in_events || selectedBooking.participate_in_events) && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Activity className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Participates in Events</p>
                            <p className="font-medium capitalize">{selectedBooking.user_data?.participate_in_events || selectedBooking.participate_in_events}</p>
                          </div>
                        </div>
                      )}
                      {(selectedBooking.user_data?.stroke_best_time || selectedBooking.stroke_best_time) && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Timer className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Stroke Best Time</p>
                            <p className="font-medium">{selectedBooking.user_data?.stroke_best_time || selectedBooking.stroke_best_time}</p>
                          </div>
                        </div>
                      )}
                      {(selectedBooking.user_data?.fitness_level || selectedBooking.fitness_level) && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Activity className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Fitness Level</p>
                            <p className="font-medium capitalize">{selectedBooking.user_data?.fitness_level || selectedBooking.fitness_level}</p>
                          </div>
                        </div>
                      )}
                      {(selectedBooking.user_data?.goals || selectedBooking.goals) && (
                        <div className="flex items-center gap-3 md:col-span-2">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Info className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Goals & Objectives</p>
                            <p className="font-medium">{selectedBooking.user_data?.goals || selectedBooking.goals}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Medical Information */}
                {(selectedBooking.user_data?.medical_conditions || selectedBooking.medical_conditions ||
                  selectedBooking.user_data?.blood_group || selectedBooking.blood_group ||
                  selectedBooking.user_data?.allergies || selectedBooking.allergies ||
                  selectedBooking.user_data?.medications || selectedBooking.medications ||
                  selectedBooking.user_data?.previous_injuries || selectedBooking.previous_injuries) && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Medical Information
                    </h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 gap-4">
                        {(selectedBooking.user_data?.blood_group || selectedBooking.blood_group) && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-full">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Blood Group</p>
                              <p className="font-medium">{selectedBooking.user_data?.blood_group || selectedBooking.blood_group}</p>
                            </div>
                          </div>
                        )}
                        {(selectedBooking.user_data?.medical_conditions || selectedBooking.medical_conditions) && (
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-100 rounded-full">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground">Medical Conditions</p>
                              <p className="font-medium">{selectedBooking.user_data?.medical_conditions || selectedBooking.medical_conditions || "None reported"}</p>
                            </div>
                          </div>
                        )}
                        {(selectedBooking.user_data?.allergies || selectedBooking.allergies) && (
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-100 rounded-full">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground">Allergies</p>
                              <p className="font-medium">{selectedBooking.user_data?.allergies || selectedBooking.allergies}</p>
                            </div>
                          </div>
                        )}
                        {(selectedBooking.user_data?.medications || selectedBooking.medications) && (
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-100 rounded-full">
                              <Info className="h-4 w-4 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground">Current Medications</p>
                              <p className="font-medium">{selectedBooking.user_data?.medications || selectedBooking.medications}</p>
                            </div>
                          </div>
                        )}
                        {(selectedBooking.user_data?.previous_injuries || selectedBooking.previous_injuries) && (
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-100 rounded-full">
                              <Info className="h-4 w-4 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground">Previous Injuries</p>
                              <p className="font-medium">{selectedBooking.user_data?.previous_injuries || selectedBooking.previous_injuries}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                {(selectedBooking.user_data?.referred_by || selectedBooking.referred_by ||
                  selectedBooking.user_data?.how_did_you_know || selectedBooking.how_did_you_know) && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Additional Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(selectedBooking.user_data?.referred_by || selectedBooking.referred_by) && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Referred By</p>
                            <p className="font-medium">{selectedBooking.user_data?.referred_by || selectedBooking.referred_by}</p>
                          </div>
                        </div>
                      )}
                      {(selectedBooking.user_data?.how_did_you_know || selectedBooking.how_did_you_know) && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <Info className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">How Did You Know About Us</p>
                            <p className="font-medium capitalize">{selectedBooking.user_data?.how_did_you_know || selectedBooking.how_did_you_know}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* User Account Details */}
                {selectedBooking.user_id && (
                  <div className="mt-6 p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Account Details</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-muted-foreground">User ID: </span>
                        <span className="text-xs font-mono">{selectedBooking.user_id}</span>
                      </div>
                      {selectedBooking.user_data?.is_verified !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Account Status: </span>
                          {selectedBooking.user_data.is_verified ? (
                            <Badge variant="default" className="text-xs bg-green-600">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Not Verified
                            </Badge>
                          )}
                        </div>
                      )}
                      {selectedBooking.user_data?.is_admin !== undefined && selectedBooking.user_data.is_admin && (
                        <div>
                          <Badge variant="destructive" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin User
                          </Badge>
                        </div>
                      )}
                      {selectedBooking.user_data?.created_at && (
                        <div>
                          <span className="text-xs text-muted-foreground">Account Created: </span>
                          <span className="text-xs">{format(new Date(selectedBooking.user_data.created_at), "dd MMM yyyy")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Slot Booking Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Hash className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Booking ID</p>
                      <p className="font-medium font-mono">{selectedBooking.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Booking Dates</p>
                      <p className="font-medium">{formatBookingDatesRange(selectedBooking)}</p>
                      {(() => {
                        const bookingDates = parseBookingDates(selectedBooking.booking_dates);
                        return bookingDates.length > 1 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-muted-foreground">All dates:</p>
                            {bookingDates.map((date: string, index: number) => (
                              <p key={index} className="text-sm">{format(new Date(date), "EEEE, MMMM d, yyyy")}</p>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time Slot</p>
                      <p className="font-medium">{selectedBooking.start_time} - {selectedBooking.end_time}</p>
                    </div>
                  </div>

                  {selectedBooking.slot_type && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Info className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Slot Type</p>
                        <p className="font-medium capitalize">{selectedBooking.slot_type}</p>
                      </div>
                    </div>
                  )}

                  {selectedBooking.location && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{selectedBooking.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <CreditCard className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-medium">₹{selectedBooking.amount || "0"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Info className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Status</p>
                      <p className="font-medium capitalize">{selectedBooking.payment_status || "Pending"}</p>
                    </div>
                  </div>

                  {selectedBooking.transaction_id && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Hash className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Transaction ID</p>
                        <p className="font-medium font-mono text-sm">{selectedBooking.transaction_id}</p>
                      </div>
                    </div>
                  )}

                  {selectedBooking.payment_method && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Method</p>
                        <p className="font-medium">{selectedBooking.payment_method}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedBooking.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Additional Notes</h3>
                    <p className="text-sm text-muted-foreground">{selectedBooking.notes}</p>
                  </div>
                </>
              )}

              {(selectedBooking.cancel_reason || selectedBooking.rescheduled_to) && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Status History</h3>
                    {selectedBooking.cancel_reason && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-destructive">Cancellation Reason:</p>
                        <p className="text-sm text-muted-foreground">{selectedBooking.cancel_reason}</p>
                      </div>
                    )}
                    {selectedBooking.rescheduled_to && (
                      <div>
                        <p className="text-sm font-medium text-blue-600">Rescheduled To:</p>
                        <p className="text-sm text-muted-foreground">{selectedBooking.rescheduled_to}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground">
                  Booking Created: {selectedBooking.created_at ? format(new Date(selectedBooking.created_at), "PPpp") : "N/A"}
                </p>
                {selectedBooking.updated_at && (
                  <p className="text-xs text-muted-foreground">
                    Last Updated: {format(new Date(selectedBooking.updated_at), "PPpp")}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewBookings;
