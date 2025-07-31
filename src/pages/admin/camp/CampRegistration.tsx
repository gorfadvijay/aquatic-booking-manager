import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Filter } from "lucide-react";
import { getAllCampBookings, getCampBookingsByStatus } from "@/lib/services/api/camp-booking-api.service";
import { CampBooking } from "@/types/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CampRegistration = () => {
  const [loading, setLoading] = useState(true);
  const [campBookings, setCampBookings] = useState<CampBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<CampBooking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchCampBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [campBookings, statusFilter]);

  const fetchCampBookings = async () => {
    setLoading(true);
    try {
      const data = await getAllCampBookings();
      setCampBookings(data);
      
      // Debug: Log payment statuses to see what values we have
      if (data.length > 0) {
        const statuses = data.map(b => b.payment_status);
        console.log("Available payment statuses:", [...new Set(statuses)]);
      }
    } catch (error) {
      console.error("Error fetching camp bookings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch camp registration data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    if (statusFilter === "all") {
      setFilteredBookings(campBookings);
    } else {
      setFilteredBookings(campBookings.filter(booking => booking.payment_status === statusFilter));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      success: "default",
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "outline",
    };

    return (
      <Badge variant={variants[status.toLowerCase()] || "secondary"}>
        {status}
      </Badge>
    );
  };

  // Helper function to check if payment is successful
  const isSuccessfulPayment = (status: string) => {
    const successStatuses = ['success', 'completed', 'paid', 'successful'];
    return successStatuses.includes(status.toLowerCase());
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const uniqueStatuses = Array.from(new Set(campBookings.map(booking => booking.payment_status)));

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Camp Registration</h1>
        <p className="text-muted-foreground">
          View and manage camp registration bookings.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading camp registration data...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Registrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{campBookings.filter(b => isSuccessfulPayment(b.payment_status)).length}</div>
                  <div className="bg-primary/10 text-primary p-2 rounded">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Successful Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">
                    {campBookings.filter(b => isSuccessfulPayment(b.payment_status)).length}
                  </div>
                  <div className="bg-green-100 text-green-600 p-2 rounded">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">
                    {formatCurrency(
                      campBookings
                        .filter(b => isSuccessfulPayment(b.payment_status))
                        .reduce((sum, b) => sum + (b.amount / 100), 0)
                    )}
                  </div>
                  <div className="bg-blue-100 text-blue-600 p-2 rounded">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Camp Registration Data</CardTitle>
                  <CardDescription>
                    All camp registration bookings and their payment status
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {uniqueStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Camp</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length === 0 ? (
                      <TableRow>
                                                <TableCell colSpan={9} className="text-center py-4">
                          No camp registrations found.
</TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">
                            {booking.name}
                          </TableCell>
                          <TableCell>{booking.email}</TableCell>
                          <TableCell>{booking.phone_number || '-'}</TableCell>
                          <TableCell>{booking.camp}</TableCell>
                          <TableCell>{booking.batch}</TableCell>
                          <TableCell>{formatCurrency(booking.amount / 100)}</TableCell>
                          <TableCell>
                            {getStatusBadge(booking.payment_status)}
                          </TableCell>
                          <TableCell>
                            {booking.transaction_id || '-'}
                          </TableCell>
                          <TableCell>
                            {formatDate(booking.created_at.toString())}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CampRegistration; 