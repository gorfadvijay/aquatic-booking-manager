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
import { InvoiceService } from "@/lib/services/invoice.service";
import { useToast } from "@/hooks/use-toast";

const BookingSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { bookingDetails, paymentReference, slotIds, bookingIds } = location.state || {};
  const [isLoading, setIsLoading] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");

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

  useEffect(() => {
    // Generate invoice for the booking if bookingIds is provided
    console.log("BookingSuccess: Booking IDs available:", bookingIds);
    if (bookingIds && bookingIds.length > 0) {
      generateInvoice(bookingIds[0]);
    } else {
      console.log("BookingSuccess: No booking IDs available to generate invoice");
    }
  }, [bookingIds]);

  const generateInvoice = async (bookingId) => {
    if (!bookingId) return;

    console.log("BookingSuccess: Starting invoice generation for booking ID:", bookingId);
    setIsLoading(true);
    try {
      // First, check if an invoice already exists for this booking
      console.log("BookingSuccess: Checking for existing invoice");
      const existingInvoice = await InvoiceService.getByBookingId(bookingId);
      
      if (existingInvoice) {
        console.log("BookingSuccess: Found existing invoice:", existingInvoice);
        setInvoiceId(existingInvoice.id);
        return;
      }

      // Get the booking to determine the amount (in a real app this would be calculated from the booking details)
      console.log("BookingSuccess: Fetching booking details");
      const booking = await BookingService.getById(bookingId);
      if (!booking) {
        console.error("BookingSuccess: Booking not found for ID:", bookingId);
        toast({
          title: "Error",
          description: "Could not find booking information",
          variant: "destructive",
        });
        return;
      }
      console.log("BookingSuccess: Found booking:", booking);

      // Get userId from localStorage
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.error("BookingSuccess: No user ID found in localStorage");
        toast({
          title: "Error",
          description: "User information not found",
          variant: "destructive",
        });
        return;
      }
      console.log("BookingSuccess: Using user ID:", userId);

      // Calculate a demo amount (in a real app this would be based on actual pricing)
      const amount = 149.99;

      // Generate invoice number
      const invoiceNumber = InvoiceService.generateInvoiceNumber();
      console.log("BookingSuccess: Generated invoice number:", invoiceNumber);

      // Create the invoice
      console.log("BookingSuccess: Creating invoice with data:", {
        booking_id: bookingId,
        invoice_number: invoiceNumber,
        generated_by: userId,
        amount: amount
      });
      
      const invoice = await InvoiceService.create({
        booking_id: bookingId,
        invoice_number: invoiceNumber,
        generated_by: userId,
        amount: amount,
        generated_at: new Date().toISOString(),
        sent_via_email: false,
        sent_via_whatsapp: false
      }).catch(error => {
        console.error("BookingSuccess: Detailed invoice creation error:", error);
        // If error contains Supabase details, log them
        if (error.message) console.error("Message:", error.message);
        if (error.code) console.error("Code:", error.code);
        if (error.details) console.error("Details:", error.details);
        if (error.hint) console.error("Hint:", error.hint);
        throw error; // Re-throw to be caught by the outer catch
      });

      console.log("BookingSuccess: Invoice created successfully:", invoice);
      setInvoiceId(invoice.id);
      
      toast({
        title: "Invoice Generated",
        description: `Invoice #${invoiceNumber} has been created successfully.`,
      });
    } catch (error) {
      console.error("BookingSuccess: Error generating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to generate invoice. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInvoice = () => {
    // If we have a real invoice ID, navigate to it
    if (invoiceId) {
      navigate(`/customer/invoice/${invoiceId}`);
    } else {
      // Otherwise use the demo flow
      navigate("/customer/invoice/123", { 
        state: { 
          bookingDetails: displayBookingDetails,
          paymentReference: displayPaymentReference,
          slotIds
        } 
      });
    }
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
            <Button 
              onClick={handleViewInvoice} 
              variant="outline" 
              className="gap-2"
              disabled={isLoading}
            >
              {isLoading ? "Generating Invoice..." : "View Invoice"}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
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