import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Edit, 
  Trash, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Ban
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, addMonths, subMonths, isSameDay, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { getAllSlots, createSlot, SlotApiService } from "@/lib/db";
import { Slot } from "@/types/schema";
import { useToast } from "@/hooks/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Form schema for creating a slot
const slotFormSchema = z.object({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  slotDuration: z.string().min(1, "Slot duration is required"),
  isHoliday: z.boolean().default(false),
});

// Type for calendar day cell
type CalendarDayInfo = {
  date: Date;
  hasSlot: boolean;
  slot?: Slot;
  isCurrentMonth: boolean;
};

const SlotManagement = () => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDayInfo[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  // Initialize form for creating slots
  const form = useForm<z.infer<typeof slotFormSchema>>({
    resolver: zodResolver(slotFormSchema),
    defaultValues: {
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: "60",
      isHoliday: false,
    },
  });

  const isHoliday = form.watch("isHoliday");

  // Fetch slots from the API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all slots
        const fetchedSlots = await getAllSlots();
        setSlots(fetchedSlots);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch slot data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Generate calendar days for the current month view
  useEffect(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Get days before the start of month to complete the calendar week
    const daysBeforeStart = [];
    let currentDay = start;
    const dayOfWeek = currentDay.getDay();
    for (let i = (dayOfWeek === 0 ? 6 : dayOfWeek - 1); i > 0; i--) {
      const prevDay = addDays(currentDay, -i);
      daysBeforeStart.push(prevDay);
    }
    
    // Get days after the end of month to complete the calendar week
    const daysAfterEnd = [];
    currentDay = end;
    const lastDayOfWeek = currentDay.getDay();
    const daysToAdd = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
    for (let i = 1; i <= daysToAdd; i++) {
      const nextDay = addDays(currentDay, i);
      daysAfterEnd.push(nextDay);
    }
    
    // Combine all days
    const allDays = [...daysBeforeStart, ...days, ...daysAfterEnd];
    
    // Create calendar days info
    const calendarInfo = allDays.map(date => {
      const slot = slots.find(s => 
        s.start_date && isSameDay(new Date(s.start_date), date)
      );
      
      return {
        date,
        hasSlot: !!slot,
        slot: slot,
        isCurrentMonth: date.getMonth() === calendarMonth.getMonth()
      };
    });
    
    setCalendarDays(calendarInfo);
  }, [calendarMonth, slots]);

  // Handle creating a new slot
  const handleCreateSlot = async (values: z.infer<typeof slotFormSchema>) => {
    if (!selectedDate) return;
    
    try {
      setLoading(true);
      
      // Check if a slot already exists for this date
      const existingSlot = slots.find(s => 
        s.start_date && isSameDay(new Date(s.start_date), selectedDate)
      );
      
      if (existingSlot) {
        toast({
          title: "Slot already exists",
          description: "Only one slot can be created per day. You may edit or delete the existing slot.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Get current time for holiday slots
      const currentTime = new Date();
      const currentTimeStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
      
      // Fix timezone issue by manually formatting the date as YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      // Prepare slot data
      const slotData = {
        start_date: formattedDate,
        start_time: values.isHoliday ? currentTimeStr : values.startTime,
        end_time: values.isHoliday ? currentTimeStr : values.endTime,
        is_holiday: values.isHoliday,
        slot_duration: parseInt(values.slotDuration),
      };
      
      // Create the slot
      await createSlot(slotData);
      
      // Refresh slots
      const updatedSlots = await getAllSlots();
      setSlots(updatedSlots);
      
      toast({
        title: "Slot created",
        description: values.isHoliday 
          ? `${format(selectedDate, "MMM d, yyyy")} marked as holiday`
          : `Slot created for ${format(selectedDate, "MMM d, yyyy")}`,
      });
      
      // Reset and close dialog
      form.reset();
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Error creating slot:", error);
      toast({
        title: "Error",
        description: "Failed to create slot",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle removing a slot
  const handleRemoveSlot = async (slotId: string) => {
    try {
      setLoading(true);
      const success = await SlotApiService.delete(slotId);
      
      if (success) {
        // Update slots after deletion
        const updatedSlots = await getAllSlots();
        setSlots(updatedSlots);
        
        toast({
          title: "Slot removed",
          description: "The slot has been removed from the calendar.",
        });
      } else {
        throw new Error("Failed to delete slot");
      }
    } catch (error) {
      console.error("Error removing slot:", error);
    toast({
        title: "Error",
        description: "Failed to remove slot",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle when a calendar day is clicked
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    // Find if there's a slot for this date
    const existingSlot = slots.find(s => 
      s.start_date && isSameDay(new Date(s.start_date), date)
    );
    
    if (!existingSlot && date >= new Date()) {
      // If no slot and date is not in the past, open the dialog to create one
      setShowCreateDialog(true);
    } else if (existingSlot) {
      // Set the current editing slot and open edit dialog
      setCurrentEditingSlot(existingSlot);
      form.setValue("startTime", existingSlot.start_time);
      form.setValue("endTime", existingSlot.end_time);
      form.setValue("slotDuration", existingSlot.slot_duration.toString());
      form.setValue("isHoliday", existingSlot.is_holiday);
      setShowEditDialog(true);
    }
  };
  
  // Render a calendar day cell
  const renderCalendarDay = (day: CalendarDayInfo) => {
    const isToday = isSameDay(day.date, new Date());
    const isSelected = selectedDate && isSameDay(day.date, selectedDate);
    const isPast = day.date < new Date() && !isToday;
    
    return (
      <div 
        key={day.date.toISOString()} 
        className={`
          h-28 border p-1 relative
          ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
          ${isToday ? 'bg-blue-50' : ''}
          ${isSelected ? 'ring-2 ring-primary' : ''}
          ${isPast ? 'bg-gray-50 text-gray-400' : ''}
          cursor-pointer hover:bg-gray-50 transition-colors
        `}
        onClick={() => handleDayClick(day.date)}
      >
        <div className="flex justify-between items-start">
          <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
            {format(day.date, "d")}
          </span>
          
          {day.hasSlot && (
            <div className="flex gap-1">
              <button 
                className="text-gray-500 hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  if (day.slot?.id) {
                    // Open edit dialog with existing slot data
                    setSelectedDate(day.date);
                    setCurrentEditingSlot(day.slot);
                    form.setValue("startTime", day.slot.start_time);
                    form.setValue("endTime", day.slot.end_time);
                    form.setValue("slotDuration", day.slot.slot_duration.toString());
                    form.setValue("isHoliday", day.slot.is_holiday);
                    setShowEditDialog(true);
                  }
                }}
              >
                <Edit className="h-4 w-4" />
              </button>
              <button 
                className="text-gray-500 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  if (day.slot?.id) handleRemoveSlot(day.slot.id);
                }}
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        
        {day.hasSlot && (
          <div 
            className={`
              mt-1 text-xs p-1 rounded
              ${day.slot?.is_holiday 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'}
            `}
          >
            {day.slot?.is_holiday 
              ? 'Holiday' 
              : `${day.slot?.start_time} - ${day.slot?.end_time}`}
          </div>
        )}
        
        {!day.hasSlot && day.isCurrentMonth && !isPast && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white shadow-lg rounded-md p-1 flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs justify-start px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDate(day.date);
                  form.setValue("isHoliday", false);
                  setShowCreateDialog(true);
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Slot
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs justify-start px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDate(day.date);
                  form.setValue("isHoliday", true);
                  setShowCreateDialog(true);
                }}
              >
                <Ban className="h-3 w-3 mr-1" /> Mark Holiday
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // State for edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentEditingSlot, setCurrentEditingSlot] = useState<Slot | null>(null);

  // Handle editing a slot
  const handleEditSlot = async (values: z.infer<typeof slotFormSchema>) => {
    if (!selectedDate || !currentEditingSlot) return;
    
    try {
      setLoading(true);
      
      // Get current time for holiday slots
      const currentTime = new Date();
      const currentTimeStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
      
      // Prepare slot data
      const slotData = {
        start_time: values.isHoliday ? currentTimeStr : values.startTime,
        end_time: values.isHoliday ? currentTimeStr : values.endTime,
        is_holiday: values.isHoliday,
        slot_duration: parseInt(values.slotDuration),
      };
      
      // Update the slot
      await SlotApiService.update(currentEditingSlot.id, slotData);
      
      // Refresh slots
      const updatedSlots = await getAllSlots();
      setSlots(updatedSlots);
      
      toast({
        title: "Slot updated",
        description: values.isHoliday 
          ? `${format(selectedDate, "MMM d, yyyy")} marked as holiday`
          : `Slot updated for ${format(selectedDate, "MMM d, yyyy")}`,
      });
      
      // Reset and close dialog
      form.reset();
      setShowEditDialog(false);
      setCurrentEditingSlot(null);
    } catch (error) {
      console.error("Error updating slot:", error);
      toast({
        title: "Error",
        description: "Failed to update slot",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Slot Management</h1>
          <p className="text-muted-foreground">
            Manage your pool availability and booking slots
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading slot data...</span>
        </div>
      )}

      {!loading && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Slot Calendar</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-medium min-w-[140px] text-center">
                  {format(calendarMonth, "MMMM yyyy")}
                </h2>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar header - days of week */}
            <div className="grid grid-cols-7 gap-px mb-px">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="py-2 text-center font-medium text-sm">
                  {day}
                        </div>
              ))}
                          </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {calendarDays.map(day => renderCalendarDay(day))}
                        </div>
            
            {/* Legend */}
            <div className="mt-4 flex gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300 mr-1"></div>
                <span>Available</span>
                      </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300 mr-1"></div>
                <span>Holiday</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog for creating slots */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {isHoliday ? "Mark as Holiday" : "Create New Slot"}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && (
                <span>
                  {isHoliday 
                    ? `Mark ${format(selectedDate, "MMMM d, yyyy")} as a holiday`
                    : `Add a new slot for ${format(selectedDate, "MMMM d, yyyy")}`}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateSlot)} className="space-y-4">
              <FormField
                control={form.control}
                name="isHoliday"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="hidden"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {!isHoliday && (
                <>
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
                </>
              )}

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isHoliday ? "Mark as Holiday" : "Create Slot"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog for editing slots */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {isHoliday ? "Update Holiday" : "Edit Slot"}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && (
                <span>
                  {isHoliday 
                    ? `Update holiday on ${format(selectedDate, "MMMM d, yyyy")}`
                    : `Edit slot for ${format(selectedDate, "MMMM d, yyyy")}`}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSlot)} className="space-y-4">
              <FormField
                control={form.control}
                name="isHoliday"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <input
                          id="is-holiday"
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="is-holiday" className="text-sm font-medium">
                          Mark as holiday
                        </label>
              </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {!isHoliday && (
                <>
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
                </>
              )}

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isHoliday ? "Update Holiday" : "Update Slot"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SlotManagement;
