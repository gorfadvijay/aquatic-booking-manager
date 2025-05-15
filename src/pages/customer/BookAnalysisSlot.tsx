import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, Clock, Check, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays, isSameDay, parseISO, addMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";
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
import { getAllSlots } from "@/lib/db";
import { Slot, Booking } from "@/types/schema";
import { getBookingsByDate } from "@/lib/services/api/booking-api.service";

// Interface for day slot info
interface DaySlotInfo {
  date: Date;
  slot: Slot | null;
  isAvailable: boolean;
}

// Interface for time slot periods
interface TimeSlotPeriod {
  id: string;
  startTime: Date;
  endTime: Date;
  formatted: string;
  isAvailable: boolean;
}

const BookAnalysisSlot = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [consecutiveDaysInfo, setConsecutiveDaysInfo] = useState<DaySlotInfo[]>([]);
  const [allDaysAvailable, setAllDaysAvailable] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<Record<string, TimeSlotPeriod[]>>({});

  // Fetch all slots when component mounts
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const fetchedSlots = await getAllSlots();
        setSlots(fetchedSlots.filter(slot => !slot.is_holiday));
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch slots:', error);
        toast({
          title: "Error",
          description: "Failed to fetch available slots",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchSlots();
  }, [toast]);

  // Generate time slots based on start time, end time and duration
  const generateTimeSlots = (slot: Slot, dateObj: Date, existingBookings: Booking[]): TimeSlotPeriod[] => {
    if (!slot.start_time || !slot.end_time || !slot.slot_duration) {
      return [];
    }

    // Debug: Log the slot details
    console.log("Generating time slots for:", {
      slotId: slot.id,
      date: format(dateObj, 'yyyy-MM-dd'),
      startTime: slot.start_time,
      endTime: slot.end_time,
      duration: slot.slot_duration
    });
    
          // Debug: Log existing bookings with more details
      console.log("Existing bookings for this date:", existingBookings.map(booking => ({
        id: booking.id,
        date: booking.booking_date,
        time: `${booking.start_time}-${booking.end_time}`,
        formattedTime: `${booking.start_time.split(':').slice(0, 2).join(':')}-${booking.end_time.split(':').slice(0, 2).join(':')}`,
        slot_id: booking.slot_id,
        rawData: booking
      })));

    const [startHour, startMinute] = slot.start_time.split(':').map(Number);
    const [endHour, endMinute] = slot.end_time.split(':').map(Number);
    
    const startDate = new Date(dateObj);
    startDate.setHours(startHour, startMinute, 0, 0);
    
    const endDate = new Date(dateObj);
    endDate.setHours(endHour, endMinute, 0, 0);
    
    const durationMinutes = slot.slot_duration;
    let currentTime = startDate;
    const slots: TimeSlotPeriod[] = [];
    
    // Format the date as yyyy-MM-dd for comparison with bookings
    const formattedDate = format(dateObj, 'yyyy-MM-dd');
    
    while (currentTime.getTime() + durationMinutes * 60000 <= endDate.getTime()) {
      const slotEndTime = new Date(currentTime.getTime() + durationMinutes * 60000);
      
      // Format current time as HH:mm for comparison with bookings
      const currentTimeFormatted = format(currentTime, 'HH:mm');
      
      // Debug: Log the time slot being checked
      console.log(`Checking time slot: ${currentTimeFormatted} on ${formattedDate}`);
      
      // Check if this time slot is already booked
      // Compare both with and without leading zeros for hours (9:00 vs 09:00)
      const isBooked = existingBookings.some(booking => {
        // Format booking date properly for comparison (in case it's not already a string in yyyy-MM-dd format)
        let bookingDateFormatted = typeof booking.booking_date === 'string' 
          ? booking.booking_date 
          : format(new Date(booking.booking_date), 'yyyy-MM-dd');
          
        // Try multiple time formats for comparison
        const bookingTime = booking.start_time;
        const normalizedCurrentTime = currentTimeFormatted; // HH:mm format (e.g., "09:00")
        const alternateTimeFormat = `${parseInt(currentTimeFormatted.split(':')[0])}:${currentTimeFormatted.split(':')[1]}`; // h:mm format (e.g., "9:00")
        
        // Handle different time formats that might come from the API
        // Some APIs return times like "11:00:00" with seconds
        const bookingTimeWithoutSeconds = bookingTime.split(':').slice(0, 2).join(':');
        
        // For debugging, get the slot ID from the booking
        const bookingSlotId = booking.slot_id;
        const currentSlotId = slot.id;
        
        // First, compare the dates
        const datesMatch = bookingDateFormatted === formattedDate;
        
        // Then compare times with all potential formats
        const timesMatch = 
          bookingTime === normalizedCurrentTime || 
          bookingTime === alternateTimeFormat ||
          bookingTimeWithoutSeconds === normalizedCurrentTime || 
          bookingTimeWithoutSeconds === alternateTimeFormat;
        
        // Check if slot IDs match (optional, depending on your booking logic)
        const slotsMatch = bookingSlotId === currentSlotId;
        
        // For this particular problem, we'll consider a slot booked if date and time match
        const isMatch = datesMatch && timesMatch;
        
        if (isMatch) {
          console.log(`Found booking match!`, {
            bookingId: booking.id,
            bookingDate: bookingDateFormatted,
            formattedDate,
            datesMatch,
            bookingTime,
            bookingTimeWithoutSeconds,
            normalizedCurrentTime,
            alternateTimeFormat,
            timesMatch,
            bookingSlotId,
            currentSlotId,
            slotsMatch
          });
        }
        
        return isMatch;
      });
      
      const isAvailable = !isBooked;
      
      // Debug: Log the availability result
      console.log(`Time slot ${currentTimeFormatted} isAvailable:`, isAvailable);
      
      slots.push({
        id: `${slot.id}-${format(currentTime, 'HHmm')}`,
        startTime: new Date(currentTime),
        endTime: new Date(slotEndTime),
        formatted: `${format(currentTime, 'h:mm a')} - ${format(slotEndTime, 'h:mm a')}`,
        isAvailable
      });
      
      // Move to next time slot
      currentTime = slotEndTime;
    }
    
    return slots;
  };

  // Update consecutive days info when date or slots change
  useEffect(() => {
    if (!date || !slots.length) {
      setConsecutiveDaysInfo([]);
      setAllDaysAvailable(false);
      setTimeSlots({});
      return;
    }

    // Get the three consecutive days
    const threeDays = [
      date,
      addDays(date, 1),
      addDays(date, 2)
    ];

    // Fetch bookings and generate time slots for each day
    const fetchBookingsAndGenerateSlots = async () => {
      try {
        // Create a map to store bookings by date
        const bookingsByDate: Record<string, Booking[]> = {};
        
        // Fetch bookings for all three days in parallel
        const bookingPromises = threeDays.map(async (day) => {
          const formattedDate = format(day, 'yyyy-MM-dd');
          const bookings = await getBookingsByDate(formattedDate);
          
          // Debug: Log fetched bookings for each date
          console.log(`Bookings for ${formattedDate}:`, bookings);
          
          bookingsByDate[formattedDate] = bookings;
          return { date: formattedDate, bookings };
        });
        
        await Promise.all(bookingPromises);
        
        // Now process the days with the booking information
        const daysInfo = threeDays.map(day => {
          const slot = slots.find(s => 
            s.start_date && isSameDay(new Date(s.start_date), day)
          );
          
          const formattedDate = format(day, 'yyyy-MM-dd');
          const dayBookings = bookingsByDate[formattedDate] || [];
          
          // Debug: Log the matched slot and bookings for this day
          console.log(`Processing day ${formattedDate}:`, {
            slot: slot ? `ID: ${slot.id}, Time: ${slot.start_time}-${slot.end_time}` : 'No slot found',
            bookingsCount: dayBookings.length,
            bookings: dayBookings.map(b => `Time: ${b.start_time}-${b.end_time}`)
          });
          
          // Generate the actual time slots for this day if a slot exists
          if (slot) {
            const dayTimeSlots = generateTimeSlots(slot, day, dayBookings);
            setTimeSlots(prev => ({
              ...prev,
              [formattedDate]: dayTimeSlots
            }));
            
            // Day is available if at least one time slot is available
            const isAvailable = dayTimeSlots.some(ts => ts.isAvailable);
            
            return {
              date: day,
              slot,
              isAvailable
            };
          }
          
          return {
            date: day,
            slot: null,
            isAvailable: false
          };
        });
        
        setConsecutiveDaysInfo(daysInfo);
        // All days are available only if each day has a slot and at least one time slot is available
        setAllDaysAvailable(daysInfo.every(day => day.slot && day.isAvailable));
        
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast({
          title: "Error",
          description: "Failed to fetch booking information",
          variant: "destructive",
        });
      }
    };
    
    fetchBookingsAndGenerateSlots();
  }, [date, slots, toast]);

  // Format the date for display
  const formattedDate = date ? format(date, "EEEE, MMMM d, yyyy") : "";

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    setSelectedTimeSlot(null); // Reset selected time slot
  };

  const handleTimeSlotSelection = (slotId: string) => {
    setSelectedTimeSlot(slotId);
    console.log(slotId,"slotId");
  };

  const handleContinue = () => {
    if (selectedTimeSlot) {
      setShowConfirmDialog(true);
    } else {
      toast({
        title: "No time slot selected",
        description: "Please select a time slot to continue.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmBooking = () => {
    // Get user data from localStorage
    const userId = localStorage.getItem('userId') || `user-${Math.random().toString(36).substring(2, 9)}`;
    let userData = null;
    
    // Try to get the complete user data object
    try {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        userData = JSON.parse(userDataString);
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
    }
    
    // Get the selected time slot
    const selectedSlotDetails = selectedTimeSlot 
      ? timeSlots[format(consecutiveDaysInfo[0].date, 'yyyy-MM-dd')]?.find(ts => ts.id === selectedTimeSlot)
      : null;
    
    // Extract only the specific selected time slot ID, not all day slots
    // The ID format is "slotId-time", so we extract just the slot ID part
    let selectedSlotId = null;
    if (selectedTimeSlot) {
      // Split on first hyphen to get the base slot ID
      const splitId = selectedTimeSlot.split('-');
      if (splitId.length > 0) {
        selectedSlotId = splitId[0]; // Get just the base slot ID
      }
    }
    
    // Log for debugging
    console.log("------- BOOKING DETAILS -------");
    console.log("User ID:", userId);
    console.log("Selected time slot ID (full):", selectedTimeSlot);
    console.log("Base slot ID:", selectedSlotId);
    console.log("Selected time slot:", selectedSlotDetails);
    console.log("Booking dates:", consecutiveDaysInfo.map(day => format(day.date, 'yyyy-MM-dd')));
    
    // Log user information from localStorage
    console.log("------- USER DETAILS -------");
    console.log("User data from localStorage:", userData);
    console.log("User ID:", userId);
    console.log("User Email:", localStorage.getItem('userEmail'));
    console.log("User Name:", localStorage.getItem('userName'));
    console.log("User Phone:", localStorage.getItem('userPhone'));
    console.log("User Swimming Experience:", localStorage.getItem('userSwimmingExperience'));
    console.log("------------------------------");
    
    // Prepare booking data to pass to the payment page with enhanced user info
    const bookingDetails = {
      id: userId,
      user: userData,
      selectedTimeSlot: selectedSlotDetails?.formatted || "No time selected",
      selectedTimeSlotId: selectedTimeSlot, // Pass the full time slot ID
      baseSlotId: selectedSlotId, // Pass just the base slot ID
      daysInfo: consecutiveDaysInfo
    };
    
    // Navigate to payment page with booking details
    navigate("/customer/payment", { state: { bookingDetails } });
  };

  // Filter out dates that don't have slots for the calendar
  const disabledDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates
    if (date < today) return true;
    
    // Check if slots exist for this date and the next two days
    const hasSlots = [0, 1, 2].every(offset => {
      const checkDate = addDays(date, offset);
      return slots.some(slot => 
        slot.start_date && isSameDay(new Date(slot.start_date), checkDate)
      );
    });
    
    return !hasSlots;
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Book Analysis Session</h1>
          <p className="text-muted-foreground">
            Schedule your 3-day swimming analysis sessions
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Select Start Date</CardTitle>
              <CardDescription>
                Choose the starting date for your 3-day analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    {loading ? (
                      <div className="p-4 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        <span>Loading available dates...</span>
                      </div>
                    ) : (
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateChange}
                        disabled={disabledDates}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Your 3-Day Analysis Schedule</Label>
             
                </div>
                <div className="grid gap-2">
                  {consecutiveDaysInfo.map((dayInfo, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center p-3 border rounded-lg",
                        dayInfo.isAvailable ? "bg-background" : "bg-gray-50 border-gray-200",
                        selectedTimeSlot && "border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center mr-3",
                        dayInfo.isAvailable ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-500"
                      )}>
                        <span className="text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Day {index + 1}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(dayInfo.date, "EEE, MMM d")}
                        </div>
                      </div>
                      {dayInfo.slot && (
                        <div className="flex items-center space-x-2">
                          {selectedTimeSlot && (
                            <div className="text-xs text-primary font-medium">
                              {timeSlots[format(consecutiveDaysInfo[0].date, 'yyyy-MM-dd')]?.find(ts => ts.id === selectedTimeSlot)?.formatted || ''}
                            </div>
                          )}
                          
                        </div>
                      )}
                      {!dayInfo.slot && (
                        <div className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">
                          No Slot
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Slot Information</CardTitle>
              <CardDescription>
                Choose an available time slot for your sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!date ? (
                <div className="text-center py-8 text-muted-foreground">
                  Please select a start date first
                </div>
              ) : loading ? (
                <div className="py-8 text-center flex justify-center items-center">
                  <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  <span>Loading slot information...</span>
                </div>
              ) : consecutiveDaysInfo.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No slots available for these dates. Please select another date.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Time slot selection */}
                <div className="space-y-4">
                    <h3 className="font-medium">Select a Time</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      The selected time will be applied to all 3 days of your analysis.
                    </p>
                    
                    {/* Show time slots from the first day that has slots */}
                    {consecutiveDaysInfo.some(day => day.slot) && (
                  <div className="grid grid-cols-2 gap-2">
                        {timeSlots[format(consecutiveDaysInfo[0].date, 'yyyy-MM-dd')]?.map((timeSlot) => (
                          console.log(timeSlot,"timeSlot"),
                      <div
                            key={timeSlot.id}
                        className={cn(
                              "p-3 border rounded-md",
                              !timeSlot.isAvailable && "opacity-60",
                              timeSlot.isAvailable && "cursor-pointer hover:border-primary",
                              selectedTimeSlot === timeSlot.id && 
                                "border-primary bg-primary/5 ring-1 ring-primary",
                              !timeSlot.isAvailable && selectedTimeSlot === timeSlot.id && 
                                "border-red-300 bg-red-50"
                        )}
                        onClick={() => {
                              if (timeSlot.isAvailable) {
                                handleTimeSlotSelection(timeSlot.id);
                          }
                        }}
                      >
                            <div className="flex justify-between items-center">
                              <span className={cn(
                                "font-medium",
                                selectedTimeSlot === timeSlot.id && "text-primary",
                                !timeSlot.isAvailable && "text-red-600"
                              )}>
                                {timeSlot.formatted}
                              </span>
                              {timeSlot.isAvailable ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-red-500" />
                              )}
                        </div>
                        <div className="text-xs mt-1">
                              {timeSlot.isAvailable ? (
                            <span className="text-green-600 font-semibold">Available</span>
                          ) : (
                            <span className="text-red-600 font-semibold">Booked</span>
                          )}
                        </div>
                      </div>
                    ))}
                      </div>
                    )}

                   
                  </div>

                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
                    <div className="font-medium mb-1">Important Information:</div>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                      <li>Please arrive 15 minutes before your scheduled time</li>
                      <li>Bring your swimming gear, including a towel</li>
                      <li>Cancellations must be made 24 hours in advance</li>
                    </ul>
                  </div>

                  <div>
                    <Button 
                      onClick={handleContinue} 
                      className="w-full" 
                      disabled={!selectedTimeSlot || !timeSlots[format(consecutiveDaysInfo[0].date, 'yyyy-MM-dd')]?.find(ts => ts.id === selectedTimeSlot)?.isAvailable}
                    >
                      {selectedTimeSlot && timeSlots[format(consecutiveDaysInfo[0].date, 'yyyy-MM-dd')]?.find(ts => ts.id === selectedTimeSlot)?.isAvailable
                        ? "Continue to Payment" 
                        : "Select an Available Time"
                      }
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Booking Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Your Booking</AlertDialogTitle>
              <AlertDialogDescription>
                You are booking a 3-day swimming analysis session on the
                following dates:
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="py-4">
                                <div className="space-y-2">
                {consecutiveDaysInfo.map((dayInfo, index) => {
                  const selectedSlot = selectedTimeSlot 
                    ? timeSlots[format(consecutiveDaysInfo[0].date, 'yyyy-MM-dd')]?.find(ts => ts.id === selectedTimeSlot)
                    : null;
                  
                  return (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 bg-background rounded border border-border"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{format(dayInfo.date, "EEE, MMM d")}</span>
                      <span className="text-xs text-muted-foreground">Day {index + 1}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-primary">
                        {selectedSlot ? selectedSlot.formatted : "No time selected"}
                      </span>
                      {/* {dayInfo.isAvailable ? (
                        <Check className="h-4 w-4 text-green-500 ml-2" />
                      ) : (
                        <X className="h-4 w-4 text-red-500 ml-2" />
                      )} */}
                    </div>
                  </div>
                  );
                })}
              </div>
              
              <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-md">
                <div className="font-medium mb-1">Important Information:</div>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Please arrive 15 minutes before your scheduled time</li>
                  <li>Bring your swimming gear, including a towel</li>
                  <li>Sessions are {consecutiveDaysInfo[0]?.slot?.slot_duration || 60} minutes long</li>
                  <li>Cancellations must be made 24 hours in advance</li>
                </ul>
              </div>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmBooking}>
                Confirm & Proceed to Payment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default BookAnalysisSlot;

