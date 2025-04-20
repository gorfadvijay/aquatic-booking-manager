
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, FileText, Users } from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back to your pool management dashboard.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">126</div>
              <div className="bg-primary/10 text-primary p-2 rounded">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              +15% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Registered Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">48</div>
              <div className="bg-primary/10 text-primary p-2 rounded">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              +5% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">$6,840</div>
              <div className="bg-primary/10 text-primary p-2 rounded">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              +12% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest bookings for analysis sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-border pb-4"
                >
                  <div>
                    <div className="font-medium">John Doe</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date().toLocaleDateString()} - 2:00 PM
                    </div>
                  </div>
                  <div className="text-sm bg-secondary text-primary px-2 py-1 rounded-full">
                    Upcoming
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Upcoming sessions for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <div className="font-medium">9:00 AM - 10:00 AM</div>
                  <div className="text-sm text-muted-foreground">
                    Emma Wilson - Analysis Session
                  </div>
                </div>
                <div className="text-sm bg-aqua-100 text-aqua-700 px-2 py-1 rounded-full">
                  In Progress
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <div className="font-medium">11:00 AM - 12:00 PM</div>
                  <div className="text-sm text-muted-foreground">
                    Michael Brown - Analysis Session
                  </div>
                </div>
                <div className="text-sm bg-secondary text-primary px-2 py-1 rounded-full">
                  Upcoming
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <div className="font-medium">2:00 PM - 3:00 PM</div>
                  <div className="text-sm text-muted-foreground">
                    Sarah Johnson - Analysis Session
                  </div>
                </div>
                <div className="text-sm bg-secondary text-primary px-2 py-1 rounded-full">
                  Upcoming
                </div>
              </div>
              <div className="flex items-center justify-between pb-4">
                <div>
                  <div className="font-medium">4:00 PM - 5:00 PM</div>
                  <div className="text-sm text-muted-foreground">
                    David Lee - Analysis Session
                  </div>
                </div>
                <div className="text-sm bg-secondary text-primary px-2 py-1 rounded-full">
                  Upcoming
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
