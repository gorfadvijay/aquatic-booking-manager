
import React, { useState } from "react";
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
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
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

// Mock time slots
const timeSlots = [
  { id: 1, time: "9:00 AM - 10:00 AM", available: true },
  { id: 2, time: "10:00 AM - 11:00 AM", available: false },
  { id: 3, time: "11:00 AM - 12:00 PM", available: true },
  { id: 4, time: "12:00 PM - 1:00 PM", available: true },
  { id: 5, time: "1:00 PM - 2:00 PM", available: false },
  { id: 6, time: "2:00 PM - 3:00 PM", available: true },
  { id: 7, time: "3:00 PM - 4:00 PM", available: true },
  { id: 8, time: "4:00 PM - 5:00 PM", available: false },
];

const BookAnalysisSlot = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Format the date for display
  const formattedDate = date ? format(date, "EEEE, MMMM d, yyyy") : "";

  // Calculate the consecutive days
  const consecutiveDays = date
    ? [date, addDays(date, 1), addDays(date, 2)]
    : [];

  const formattedConsecutiveDays = consecutiveDays.map((d) =>
    format(d, "EEE, MMM d")
  );

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    setSelectedTimeSlot(null); // Reset selected time slot when date changes
  };

  const handleTimeSlotSelection = (slotId: number) => {
    setSelectedTimeSlot(slotId);
  };

  const handleContinue = () => {
    if (selectedTimeSlot !== null) {
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
    navigate("/customer/payment");
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
              <CardTitle>Select Date</CardTitle>
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
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateChange}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-4">
                <Label>Your 3-Day Analysis Schedule</Label>
                <div className="grid gap-2">
                  {formattedConsecutiveDays.map((day, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 border border-border rounded-lg bg-background"
                    >
                      <div className="h-8 w-8 bg-primary/10 text-primary rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">Day {index + 1}</div>
                        <div className="text-sm text-muted-foreground">
                          {day}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Select Time Slot</CardTitle>
              <CardDescription>
                Choose a time slot for all 3 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!date ? (
                <div className="text-center py-8 text-muted-foreground">
                  Please select a date first
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        const prevDay = new Date(date);
                        prevDay.setDate(prevDay.getDate() - 1);
                        if (prevDay >= new Date()) {
                          setDate(prevDay);
                        }
                      }}
                      disabled={
                        date &&
                        new Date(date).setHours(0, 0, 0, 0) ===
                          new Date().setHours(0, 0, 0, 0)
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-medium">{formattedDate}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        const nextDay = new Date(date);
                        nextDay.setDate(nextDay.getDate() + 1);
                        setDate(nextDay);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className={cn(
                          "p-3 border rounded-md cursor-pointer transition-colors",
                          slot.available
                            ? "hover:border-primary"
                            : "opacity-50 cursor-not-allowed",
                          selectedTimeSlot === slot.id
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        )}
                        onClick={() => {
                          if (slot.available) {
                            handleTimeSlotSelection(slot.id);
                          }
                        }}
                      >
                        <div
                          className={cn(
                            "text-sm font-medium",
                            selectedTimeSlot === slot.id && "text-primary"
                          )}
                        >
                          {slot.time}
                        </div>
                        <div className="text-xs mt-1">
                          {slot.available ? (
                            <span className="text-green-600">Available</span>
                          ) : (
                            <span className="text-red-600">Booked</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6">
                    <Button onClick={handleContinue} className="w-full">
                      Continue to Payment
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
                {formattedConsecutiveDays.map((day, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 bg-background rounded border border-border"
                  >
                    <span>{day}</span>
                    <span className="font-medium">
                      {selectedTimeSlot !== null
                        ? timeSlots.find((slot) => slot.id === selectedTimeSlot)
                            ?.time
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-md">
                <div className="font-medium mb-1">Important Information:</div>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Please arrive 15 minutes before your scheduled time</li>
                  <li>Bring your swimming gear, including a towel</li>
                  <li>Sessions are 60 minutes long</li>
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
