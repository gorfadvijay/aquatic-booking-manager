
import React, { useState } from "react";
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

// Mocked booking data
const bookingsData = [
  {
    id: "1",
    customerName: "John Smith",
    age: 28,
    bookingDate: "2023-04-22",
    timeSlot: "9:00 AM - 10:00 AM",
    email: "john.smith@example.com",
    phone: "+1 (555) 123-4567",
    status: "upcoming",
  },
  {
    id: "2",
    customerName: "Emma Wilson",
    age: 24,
    bookingDate: "2023-04-22",
    timeSlot: "10:00 AM - 11:00 AM",
    email: "emma.w@example.com",
    phone: "+1 (555) 234-5678",
    status: "upcoming",
  },
  {
    id: "3",
    customerName: "Michael Brown",
    age: 32,
    bookingDate: "2023-04-22",
    timeSlot: "1:00 PM - 2:00 PM",
    email: "m.brown@example.com",
    phone: "+1 (555) 345-6789",
    status: "upcoming",
  },
  {
    id: "4",
    customerName: "Sarah Johnson",
    age: 26,
    bookingDate: "2023-04-23",
    timeSlot: "9:00 AM - 10:00 AM",
    email: "sarah.j@example.com",
    phone: "+1 (555) 456-7890",
    status: "upcoming",
  },
  {
    id: "5",
    customerName: "David Lee",
    age: 30,
    bookingDate: "2023-04-23",
    timeSlot: "3:00 PM - 4:00 PM",
    email: "david.lee@example.com",
    phone: "+1 (555) 567-8901",
    status: "upcoming",
  },
];

const ViewBookings = () => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);

  // Format the currently selected date for display
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(selectedDate);

  // Filter bookings for the selected date
  const filteredBookings = bookingsData.filter(
    (booking) => booking.bookingDate === "2023-04-22"
  );

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

  const handleCancelBooking = () => {
    toast({
      title: "Booking cancelled",
      description: "Customer has been notified and refund has been initiated.",
    });
    setCancelBookingId(null);
  };

  const handleRescheduleBooking = () => {
    toast({
      title: "Booking rescheduled",
      description: "Customer has been notified about the new booking time.",
    });
    setRescheduleBookingId(null);
  };

  const handleGenerateInvoice = (bookingId: string) => {
    toast({
      title: "Invoice generated",
      description: "Invoice has been generated and sent to the customer.",
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

              <Button variant="outline" className="gap-2">
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
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No bookings found</h3>
              <p className="text-muted-foreground">
                There are no bookings scheduled for this day.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
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
                        Age: {booking.age} • {booking.timeSlot}
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
                          onClick={() => {
                            toast({
                              title: "Email sent",
                              description: "Reminder email sent to customer.",
                            });
                          }}
                          className="flex items-center gap-2"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          <span>Send Reminder</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            toast({
                              title: "Details shown",
                              description: "Viewing customer details",
                            });
                          }}
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Time</label>
              <Select defaultValue="9:00">
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
