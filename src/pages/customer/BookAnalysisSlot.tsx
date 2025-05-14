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
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays, isSameDay, parseISO } from "date-fns";
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

// Interface for day slot info
interface DaySlotInfo {
  date: Date;
  slot: Slot | null;
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

  // Update consecutive days info when date or slots change
  useEffect(() => {
    if (!date || !slots.length) {
      setConsecutiveDaysInfo([]);
      setAllDaysAvailable(false);
      return;
    }

    // Get the three consecutive days
    const threeDays = [
      date,
      addDays(date, 1),
      addDays(date, 2)
    ];

    // Check availability for each day
    const daysInfo = threeDays.map(day => {
      const slot = slots.find(s => 
        s.start_date && isSameDay(new Date(s.start_date), day)
      );
      
      // For demo purposes, randomly determine if a slot is available
      // In a real app, this would check against existing bookings
      const isAvailable = slot ? Math.random() > 0.3 : false; // 70% chance of being available if slot exists
      
      return {
        date: day,
        slot,
        isAvailable: slot ? isAvailable : false
      };
    });

    setConsecutiveDaysInfo(daysInfo);
    // All days are available only if each day has a slot and is available
    setAllDaysAvailable(daysInfo.every(day => day.slot && day.isAvailable));
  }, [date, slots]);

  // Format the date for display
  const formattedDate = date ? format(date, "EEEE, MMMM d, yyyy") : "";

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
  };

  const handleContinue = () => {
    if (allDaysAvailable) {
      setShowConfirmDialog(true);
    } else {
      toast({
        title: "Not all days available",
        description: "Please select a date where all three consecutive days have available slots.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmBooking = () => {
    navigate("/customer/payment");
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
                <Label>Your 3-Day Analysis Schedule</Label>
                <div className="grid gap-2">
                  {consecutiveDaysInfo.map((dayInfo, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center p-3 border rounded-lg",
                        dayInfo.isAvailable ? "bg-background" : "bg-gray-50 border-gray-200"
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
                        <div className={cn(
                          "text-xs px-2 py-1 rounded flex items-center",
                          dayInfo.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          <Clock className="h-3 w-3 mr-1" />
                          {dayInfo.isAvailable ? "Available" : "Booked"}
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
                Booking details for all three days
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
                  <div className="space-y-4">
                    <h3 className="font-medium">Slot Details</h3>
                    
                    {consecutiveDaysInfo.map((dayInfo, index) => (
                      <div key={index} className="border rounded-md p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{format(dayInfo.date, "EEEE, MMMM d")}</span>
                          {dayInfo.isAvailable ? (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Available</span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">Unavailable</span>
                          )}
                        </div>
                        
                        {dayInfo.slot ? (
                          <div className="text-sm">
                            <div className="flex items-center text-muted-foreground mb-1">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>Time: {dayInfo.slot.start_time} - {dayInfo.slot.end_time}</span>
                            </div>
                            <div className="text-muted-foreground">
                              Session duration: {dayInfo.slot.slot_duration} minutes
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No slot available for this day
                          </div>
                        )}
                      </div>
                    ))}
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
                      disabled={!allDaysAvailable}
                    >
                      {allDaysAvailable ? 
                        "Continue to Payment" : 
                        "Not All Days Available"
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
                {consecutiveDaysInfo.map((dayInfo, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 bg-background rounded border border-border"
                  >
                    <span>{format(dayInfo.date, "EEE, MMM d")}</span>
                    <span className="font-medium">
                      {dayInfo.slot ? `${dayInfo.slot.start_time} - ${dayInfo.slot.end_time}` : "No time"}
                    </span>
                  </div>
                ))}
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

