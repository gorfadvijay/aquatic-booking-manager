
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Plus } from "lucide-react";
import { getAllSlots, createSlotException } from "@/lib/api";
import { Slot } from "@/types/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const SlotManagement = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const fetchedSlots = await getAllSlots();
        setSlots(fetchedSlots);
      } catch (error) {
        console.error("Failed to fetch slots:", error);
        toast({
          title: "Error",
          description: "Failed to fetch slot data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [toast]);

  const handleRemoveSpecialDate = async (date: string) => {
    try {
      // In a real app, we would call an API to remove the special date
      toast({
        title: "Special date removed",
        description: `${date} has been removed from special dates.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove special date",
        variant: "destructive",
      });
    }
  };

  const handleAddSpecialDate = () => {
    // In a real app, this would open a modal to add a special date
    toast({
      title: "Add Special Date",
      description: "This would open a modal to add a special date",
    });
  };
  
  // Sort slots by day of week index
  const getDayIndex = (day: string) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return days.indexOf(day);
  };
  
  const sortedSlots = [...slots].sort((a, b) => getDayIndex(a.day_of_week) - getDayIndex(b.day_of_week));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Slot Management</h1>
          <p className="text-muted-foreground">
            Manage your pool availability and booking slots
          </p>
        </div>
        <Link to="/admin/slots/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Slots</span>
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>
              Current availability for this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">Loading slot data...</div>
            ) : (
              <div className="space-y-4">
                {sortedSlots.map((slot, index) => {
                  const dayIndex = getDayIndex(slot.day_of_week) + 1;
                  return (
                    <div key={slot.id} className="flex items-center justify-between border-b border-border pb-4">
                      <div className="flex items-center gap-3">
                        <div className={`${slot.is_holiday ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"} p-2 rounded`}>
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{slot.day_of_week}</div>
                          <div className="text-sm text-muted-foreground">
                            {slot.is_holiday ? (
                              "Holiday"
                            ) : (
                              `${slot.start_time} - ${slot.end_time}`
                            )}
                          </div>
                        </div>
                      </div>
                      <Link to={`/admin/slots/edit/${dayIndex}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Special Dates</CardTitle>
            <CardDescription>
              Holidays and custom schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-destructive/10 text-destructive p-2 rounded">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">December 25, 2023</div>
                    <div className="text-sm text-muted-foreground">
                      Christmas Day
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRemoveSpecialDate("December 25, 2023")}
                >
                  Remove
                </Button>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-destructive/10 text-destructive p-2 rounded">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">January 1, 2024</div>
                    <div className="text-sm text-muted-foreground">
                      New Year's Day
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRemoveSpecialDate("January 1, 2024")}
                >
                  Remove
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary p-2 rounded">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">February 14, 2024</div>
                    <div className="text-sm text-muted-foreground">
                      Modified Hours: 10:00 AM - 2:00 PM
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            </div>

            <Button className="w-full mt-6" variant="outline" onClick={handleAddSpecialDate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Special Date
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SlotManagement;
