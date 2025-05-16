import React, { useEffect, useState } from "react";
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
import { BookingService } from "@/lib/services/booking.service";

const BookingSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingDetails, paymentReference, slotIds } = location.state || {};
  const [isLoading, setIsLoading] = useState(false);

  // If no state data was passed, we can use these default values
  const defaultBookingDetails = {
    daysInfo: [
      { date: new Date().toISOString() },
      { date: new Date(Date.now() + 86400000).toISOString() }, // Next day
      { date: new Date(Date.now() + 172800000).toISOString() }, // Day after next
    ],
    selectedTimeSlot: "10:00 AM - 11:00 AM"
  };
  
  const displayBookingDetails = bookingDetails || defaultBookingDetails;
  const displayPaymentReference = paymentReference || "PAY-" + Math.random().toString(36).substring(2, 10).toUpperCase();

  const handleViewInvoice = () => {
    navigate("/customer/invoice/123", { 
      state: { 
        bookingDetails: displayBookingDetails,
        paymentReference: displayPaymentReference,
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