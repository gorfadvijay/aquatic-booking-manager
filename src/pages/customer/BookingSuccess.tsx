import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";

const BookingSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingDetails, paymentReference, slotIds } = location.state || {};

  const handleViewInvoice = () => {
    navigate("/customer/invoice/123", { 
      state: { 
        bookingDetails,
        paymentReference,
        slotIds
      } 
    });
  };

  const handleBookAnother = () => {
    navigate("/customer/book");
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-muted-foreground">
            Your swimming analysis sessions have been successfully booked.
          </p>
        </div>

        <Card className="shadow-md mb-6">
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>
              Your 3-day swimming analysis session information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Session Dates</h3>
                <div className="space-y-3">
                  {bookingDetails?.daysInfo?.map((dayInfo: any, index: number) => (
                    <div 
                      key={index} 
                      className="flex items-center p-3 border rounded-lg"
                    >
                      <div className="bg-primary/10 h-10 w-10 rounded-full flex items-center justify-center mr-3">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">Day {index + 1}</div>
                        <div className="text-sm text-muted-foreground">
                          {dayInfo.date ? format(new Date(dayInfo.date), "EEEE, MMMM d, yyyy") : "Date not available"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center mb-3">
                  <Clock className="h-5 w-5 text-muted-foreground mr-2" />
                  <h3 className="font-medium">Time Slot</h3>
                </div>
                <p className="text-lg font-medium text-center py-2">
                  {bookingDetails?.selectedTimeSlot || "Time not available"}
                </p>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Payment Reference</span>
                  <span className="font-mono">{paymentReference || "Payment reference not available"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-3">
          <p className="text-muted-foreground mb-4">
            A confirmation email has been sent to your registered email address.
            Please arrive 15 minutes before your session and bring your swimming gear.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleViewInvoice} variant="outline" className="gap-2">
              View Invoice
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button onClick={handleBookAnother}>
              Book Another Session
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess; 