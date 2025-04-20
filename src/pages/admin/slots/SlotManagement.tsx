
import React from "react";
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

const SlotManagement = () => {
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
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary p-2 rounded">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Monday</div>
                    <div className="text-sm text-muted-foreground">
                      9:00 AM - 5:00 PM
                    </div>
                  </div>
                </div>
                <Link to="/admin/slots/edit/1">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary p-2 rounded">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Tuesday</div>
                    <div className="text-sm text-muted-foreground">
                      9:00 AM - 5:00 PM
                    </div>
                  </div>
                </div>
                <Link to="/admin/slots/edit/2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary p-2 rounded">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Wednesday</div>
                    <div className="text-sm text-muted-foreground">
                      9:00 AM - 5:00 PM
                    </div>
                  </div>
                </div>
                <Link to="/admin/slots/edit/3">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary p-2 rounded">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Thursday</div>
                    <div className="text-sm text-muted-foreground">
                      9:00 AM - 5:00 PM
                    </div>
                  </div>
                </div>
                <Link to="/admin/slots/edit/4">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary p-2 rounded">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Friday</div>
                    <div className="text-sm text-muted-foreground">
                      9:00 AM - 5:00 PM
                    </div>
                  </div>
                </div>
                <Link to="/admin/slots/edit/5">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-destructive/10 text-destructive p-2 rounded">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Saturday</div>
                    <div className="text-sm text-muted-foreground">
                      Holiday
                    </div>
                  </div>
                </div>
                <Link to="/admin/slots/edit/6">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-destructive/10 text-destructive p-2 rounded">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Sunday</div>
                    <div className="text-sm text-muted-foreground">
                      Holiday
                    </div>
                  </div>
                </div>
                <Link to="/admin/slots/edit/7">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
            </div>
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
                <Button variant="outline" size="sm">
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
                <Button variant="outline" size="sm">
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

            <Button className="w-full mt-6" variant="outline">
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
