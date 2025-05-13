import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Calendar, Users } from "lucide-react";
import { getSlotById, updateSlot } from "@/lib/api";
import { Slot, Booking } from "@/types/schema";

// Import the modified EnrichedBooking interface to handle the additional properties
interface EnrichedBooking extends Booking {
  customerName?: string;
  email?: string;
  phone?: string;
  age?: number;
}

const formSchema = z.object({
  dayName: z.string().min(1, "Day name is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  slotDuration: z.string().min(1, "Slot duration is required"),
  isHoliday: z.boolean().default(false),
  holidayReason: z.string().optional(),
});

const EditSlots = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [conflicts, setConflicts] = useState<EnrichedBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const dayLookup: Record<string, string> = {
    "1": "Monday",
    "2": "Tuesday",
    "3": "Wednesday",
    "4": "Thursday",
    "5": "Friday",
    "6": "Saturday",
    "7": "Sunday",
  };

  // Get the day index from the URL parameter (1-7)
  const dayIndex = id ? parseInt(id) : 0;
  // Get the corresponding day name
  const dayName = id ? dayLookup[id] : "Unknown";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dayName: dayName,
      startTime: "",
      endTime: "",
      slotDuration: "60",
      isHoliday: false,
      holidayReason: "",
    },
  });

  // Fetch slot data on component mount
  useEffect(() => {
    const fetchSlotData = async () => {
      try {
        if (!id) return;
        
        // In a real app with a complete API connection, we would:
        // 1. Get all slots
        const slots = await getSlotById("placeholder"); // This would be the actual slot ID
        // 2. Find the one matching our day
        
        // For now, we'll use a workaround with day-based lookups
        const allSlots = await getAllSlots();
        const matchingSlot = allSlots.find(slot => slot.day_of_week === dayName);
        
        if (matchingSlot) {
          setSlot(matchingSlot);
          
          // Set form values based on the slot data
          form.reset({
            dayName: matchingSlot.day_of_week,
            startTime: matchingSlot.is_holiday ? "" : matchingSlot.start_time,
            endTime: matchingSlot.is_holiday ? "" : matchingSlot.end_time,
            slotDuration: "60", // This would come from a slot_duration field if available
            isHoliday: matchingSlot.is_holiday,
            holidayReason: matchingSlot.is_holiday ? "Weekend" : "",
          });
        }
      } catch (error) {
        console.error("Error fetching slot data:", error);
        toast({
          title: "Error",
          description: "Failed to load slot data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSlotData();
  }, [id, dayName, form, toast]);

  // Mock function to get all slots - in a real app this would come from your API
  async function getAllSlots() {
    // This is for testing purposes - in a real app, this would be replaced with api.getAllSlots()
    return [
      {
        id: "1",
        day_of_week: "Monday",
        start_time: "09:00",
        end_time: "17:00",
        is_holiday: false,
        created_by: "admin-id",
        created_at: new Date().toISOString()
      },
      {
        id: "2",
        day_of_week: "Tuesday",
        start_time: "09:00",
        end_time: "17:00",
        is_holiday: false,
        created_by: "admin-id",
        created_at: new Date().toISOString()
      },
      {
        id: "3",
        day_of_week: "Wednesday",
        start_time: "09:00",
        end_time: "17:00",
        is_holiday: false,
        created_by: "admin-id",
        created_at: new Date().toISOString()
      },
      {
        id: "4",
        day_of_week: "Thursday",
        start_time: "09:00",
        end_time: "17:00",
        is_holiday: false,
        created_by: "admin-id",
        created_at: new Date().toISOString()
      },
      {
        id: "5",
        day_of_week: "Friday",
        start_time: "09:00",
        end_time: "17:00",
        is_holiday: false,
        created_by: "admin-id",
        created_at: new Date().toISOString()
      },
      {
        id: "6",
        day_of_week: "Saturday",
        start_time: "",
        end_time: "",
        is_holiday: true,
        created_by: "admin-id",
        created_at: new Date().toISOString()
      },
      {
        id: "7",
        day_of_week: "Sunday",
        start_time: "",
        end_time: "",
        is_holiday: true,
        created_by: "admin-id",
        created_at: new Date().toISOString()
      }
    ]
  }

  const isHoliday = form.watch("isHoliday");
  
  // Mock conflicting booking data
  const mockConflictingBookings = [
    {
      id: "booking1",
      user_id: "user1",
      slot_id: "slot1",
      booking_date: "2023-04-24",
      start_time: "14:00",
      end_time: "15:00",
      status: "booked" as const,
      rescheduled_to: null,
      cancel_reason: null,
      created_at: new Date().toISOString(),
      customerName: "John Smith",
      email: "john.smith@example.com",
      phone: "+1 (555) 123-4567",
    },
    {
      id: "booking2",
      user_id: "user2",
      slot_id: "slot2",
      booking_date: "2023-04-25",
      start_time: "15:00",
      end_time: "16:00",
      status: "booked" as const,
      rescheduled_to: null,
      cancel_reason: null,
      created_at: new Date().toISOString(),
      customerName: "Sarah Johnson",
      email: "sarah.j@example.com",
      phone: "+1 (555) 987-6543",
    },
  ];
  
  function handleSubmit(values: z.infer<typeof formSchema>) {
    // Check for conflicts with existing bookings
    // In a real app, this would check for actual conflicts
    setConflicts(mockConflictingBookings);
    
    if (mockConflictingBookings.length > 0) {
      setShowConflictDialog(true);
    } else {
      saveChanges(values);
    }
  }

  function saveChanges(values: z.infer<typeof formSchema>) {
    console.log(values);
    
    // In a real app with a connection to the mock DB, we would:
    if (slot) {
      updateSlot(slot.id, {
        is_holiday: values.isHoliday,
        start_time: values.isHoliday ? "" : values.startTime,
        end_time: values.isHoliday ? "" : values.endTime
      }).then(({slot}) => {
        toast({
          title: "Slots updated successfully",
          description: "The schedule has been updated.",
        });
        navigate("/admin/slots");
      }).catch(error => {
        toast({
          title: "Error",
          description: "Failed to update slots",
          variant: "destructive",
        });
      });
    } else {
      toast({
        title: "Slots updated successfully",
        description: "The schedule has been updated.",
      });
      navigate("/admin/slots");
    }
  }

  function resolveConflicts() {
    // Logic to send notifications to affected customers would go here
    toast({
      title: "Notifications sent",
      description: `${conflicts.length} customers have been notified about the schedule change.`,
    });
    
    // Then save the changes
    saveChanges(form.getValues());
    setShowConflictDialog(false);
  }

  if (loading) {
    return <div className="p-6">Loading slot data...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit {dayName} Schedule</h1>
        <p className="text-muted-foreground">
          Modify availability for {dayName}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Configuration</CardTitle>
          <CardDescription>
            Update the availability settings for {dayName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="isHoliday"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Mark as Holiday</FormLabel>
                      <FormDescription>
                        Select this option if the pool will be unavailable on {dayName}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {isHoliday && (
                <FormField
                  control={form.control}
                  name="holidayReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Holiday Reason</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Weekend, Public Holiday, Maintenance, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {!isHoliday && (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slotDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slot Duration (minutes)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                            <SelectItem value="90">90 minutes</SelectItem>
                            <SelectItem value="120">120 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/slots")}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Conflict Resolution Dialog */}
      <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <AlertDialogContent className="max-w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Booking Conflicts Detected</AlertDialogTitle>
            <AlertDialogDescription>
              These schedule changes will affect existing bookings. Would you like to notify the affected customers?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4 max-h-[300px] overflow-y-auto">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Users className="h-4 w-4" /> 
              <span>Affected Bookings</span>
            </h3>
            
            <div className="space-y-3">
              {conflicts.map((booking) => (
                <div key={booking.id} className="bg-background p-3 rounded-md border">
                  <div className="font-medium">{booking.customerName || "Unknown"}</div>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> 
                      {booking.booking_date ? String(booking.booking_date) : ""}
                    </span>
                    <span>{booking.email || "No email"}</span>
                    <span>{booking.phone || "No phone"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel Changes</AlertDialogCancel>
            <AlertDialogAction onClick={resolveConflicts}>
              Notify Customers & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditSlots;
