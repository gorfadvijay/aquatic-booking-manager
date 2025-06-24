import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, LockIcon, CheckCircleIcon, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { createBooking } from "@/lib/services/api/booking-api.service";
import { createPaymentOrder, verifyPayment, generateMerchantOrderId } from "@/lib/services/api/phonepe-api.service";

const formSchema = z.object({
  mobileNumber: z.string().optional(),
});

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    startDate: new Date(),
    selectedTimeSlot: "9:00 AM - 10:00 AM", // Default value
    selectedTimeSlotId: null, // Store the selected time slot ID
    baseSlotId: null, // Store the base slot ID
    daysInfo: [
      // Default values in case no state is passed
      { date: new Date(), slot: { id: "demo-slot-1" } },
      { date: new Date(Date.now() + 86400000), slot: { id: "demo-slot-2" } },
      { date: new Date(Date.now() + 172800000), slot: { id: "demo-slot-3" } }
    ],
    id: `user-${Math.random().toString(36).substring(2, 9)}` // Demo user ID
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [slotIds, setSlotIds] = useState<string[]>([]);

  // Get booking information from location state
  useEffect(() => {
    if (location.state?.bookingDetails) {
      setBookingDetails(location.state.bookingDetails);
      
      // Extract slot IDs from the daysInfo array
      const extractedSlotIds = location.state.bookingDetails.daysInfo
        .filter((day: any) => day.slot?.id)
        .map((day: any) => day.slot.id);
      
      setSlotIds(extractedSlotIds);
      
      console.log("------- SELECTED SLOT DETAILS -------");
      console.log("Selected time slot:", location.state.bookingDetails.selectedTimeSlot);
      console.log("Selected time slot ID:", location.state.bookingDetails.selectedTimeSlotId);
      console.log("Base slot ID:", location.state.bookingDetails.baseSlotId);
      console.log("Slot IDs for all days:", extractedSlotIds);
      console.log("User ID:", location.state.bookingDetails.id);
      console.log("------------------------------------");
    }
  }, [location]);

  // Load user data from localStorage
  useEffect(() => {
    // Try to get user data from localStorage first
    try {
      const userData = localStorage.getItem('userData');
      const userId = localStorage.getItem('userId');
      
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        console.log("User data loaded from localStorage:", parsedUserData);
        setCurrentUser(parsedUserData);
      } else if (userId) {
        // If we only have the ID, create a minimal user object
        console.log("User ID loaded from localStorage:", userId);
        setCurrentUser({ id: userId });
      }
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
    }
  }, []);

  // Handle return from PhonePe payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const merchantOrderId = urlParams.get('merchantOrderId');
    
    // Handle PhonePe payment verification
    if (merchantOrderId) {
      console.log('🔄 Starting payment verification for:', merchantOrderId);
      setIsVerifying(true);
      
      const verifyPhonePePayment = async () => {
        try {
          console.log('📞 Calling verify-payment function...');
          
          const verificationResponse = await verifyPayment({
            merchantOrderId: merchantOrderId
          });

          console.log('📋 Verification response:', verificationResponse);

          if (verificationResponse.success && (verificationResponse.status === 'COMPLETED' || verificationResponse.state === 'COMPLETED')) {
            console.log('✅ Payment verification successful!');
            
            // Get pending payment data if available
            const pendingPayment = localStorage.getItem('pendingPayment');
            let paymentData = null;
            
            if (pendingPayment) {
              paymentData = JSON.parse(pendingPayment);
              localStorage.removeItem('pendingPayment');
              console.log('📦 Using stored payment data');
            } else {
              // Create minimal booking data if no stored data exists
              paymentData = {
                bookingDetails: {
                  ...bookingDetails,
                  daysInfo: bookingDetails.daysInfo || [
                    { date: new Date().toISOString().split('T')[0], slot: { id: 'default-slot' } }
                  ]
                }
              };
              console.log('📦 Using default booking data');
            }
            
            toast({
              title: "Payment Successful! 🎉",
              description: "Your booking has been confirmed.",
            });
            
            // Navigate to success page
            navigate("/customer/booking-success", {
              state: {
                bookingDetails: paymentData.bookingDetails,
                paymentReference: merchantOrderId,
                slotIds: slotIds.length > 0 ? slotIds : ['default-slot'],
                bookingIds: verificationResponse.bookingIds || [],
                userId: currentUser?.id || bookingDetails.id || 'guest-user',
                verificationResponse: verificationResponse
              }
            });
          } else {
            console.log('❌ Payment verification failed:', verificationResponse.error);
            toast({
              title: "Payment Failed ❌",
              description: verificationResponse.error || "Payment could not be processed. Please try again.",
              variant: "destructive",
            });
            
            // Navigate to payment fail page
            navigate("/customer/payment-fail", {
              state: {
                error: verificationResponse.error || "Payment verification failed",
                merchantOrderId: merchantOrderId
              }
            });
          }
        } catch (error) {
          console.error("❌ Payment verification error:", error);
          toast({
            title: "Verification Error",
            description: "Could not verify payment status. Please contact support.",
            variant: "destructive",
          });
          
          // Navigate to payment fail page
          navigate("/customer/payment-fail", {
            state: {
              error: "Payment verification failed",
              merchantOrderId: merchantOrderId
            }
          });
        } finally {
          setIsVerifying(false);
        }
      };

      // Add a small delay to ensure the component is fully loaded
      setTimeout(() => {
        verifyPhonePePayment();
      }, 100);
    }
  }, [navigate, toast, currentUser, bookingDetails, slotIds]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mobileNumber: "",
    },
  });

  const handlePhonePePayment = async (values: z.infer<typeof formSchema>) => {
    setIsProcessing(true);

    try {
      // Generate unique merchant order ID as per PhonePe standards
      const merchantOrderId = generateMerchantOrderId();
      const amount = 149.99;

      // Prepare booking metadata
      const timeSlotParts = bookingDetails.selectedTimeSlot.split(' - ');
      const startTimeStr = timeSlotParts[0]; // e.g., "9:00 AM"
      let hour = parseInt(startTimeStr.split(':')[0]);
      const minute = parseInt(startTimeStr.split(':')[1].split(' ')[0]);
      const period = startTimeStr.split(' ')[1]; // AM or PM
      
      // Convert to 24-hour format
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      const formattedStartTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // For end time, we can use the slot duration if available, otherwise assume 1 hour
      const slotDuration = (bookingDetails.daysInfo[0]?.slot as any)?.slot_duration || 60;
      const endHour = Math.floor(hour + slotDuration / 60);
      const endMinute = minute + (slotDuration % 60);
      const formattedEndTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

      // Prepare booking metadata for each day
      const daysInfo = bookingDetails.daysInfo.map(dayInfo => ({
        date: format(new Date(dayInfo.date), 'yyyy-MM-dd'),
        slot: {
          id: dayInfo.slot?.id
        }
      }));

      const bookingMetadata = {
        daysInfo: daysInfo,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        userId: currentUser?.id || bookingDetails.id,
        userDetails: {
          name: localStorage.getItem('userName') || 'Guest',
          email: localStorage.getItem('userEmail') || 'guest@example.com',
          phone: values.mobileNumber || currentUser?.phone || localStorage.getItem('userPhone') || '9999999999'
        }
      };

      // Store payment data for verification after redirect
      localStorage.setItem('pendingPayment', JSON.stringify({
        bookingDetails,
        amount,
        bookingMetadata
      }));

      // Create PhonePe payment order using Edge Functions
      const paymentResponse = await createPaymentOrder({
        merchantOrderId: merchantOrderId,
        amount: amount,
        userDetails: {
          id: currentUser?.id || bookingDetails.id,
          name: localStorage.getItem('userName') || 'Guest',
          email: localStorage.getItem('userEmail') || 'guest@example.com',
          phone: values.mobileNumber || currentUser?.phone || localStorage.getItem('userPhone') || '9999999999'
        },
        bookingMetadata: bookingMetadata
      });

      if (paymentResponse.success && paymentResponse.paymentUrl) {
        // Redirect to PhonePe
        window.location.href = paymentResponse.paymentUrl;
      } else {
        throw new Error(paymentResponse.error || 'Failed to create payment order');
      }
      
    } catch (error: any) {
      console.error("PhonePe payment error:", error);
      
      // Handle rate limiting specifically
      if (error.message?.includes('Rate limit exceeded') || error.message?.includes('TOO_MANY_REQUESTS')) {
        toast({
          title: "Rate Limit Exceeded",
          description: "Too many payment requests. Please wait 2-5 minutes before trying again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Error",
          description: "Failed to initiate PhonePe payment. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const createBookingsInDatabase = async () => {
      try {
        // Prepare user data
        const userData = {
        name: localStorage.getItem('userName') || 'Guest',
        email: localStorage.getItem('userEmail') || 'guest@example.com',
        phone: localStorage.getItem('userPhone') || '',
          dob: new Date().toISOString()
        };
        
        // Extract time from the timeSlot string (e.g., "9:00 AM - 10:00 AM" -> "09:00")
        const timeSlotParts = bookingDetails.selectedTimeSlot.split(' - ');
        const startTimeStr = timeSlotParts[0]; // e.g., "9:00 AM"
        let hour = parseInt(startTimeStr.split(':')[0]);
        const minute = parseInt(startTimeStr.split(':')[1].split(' ')[0]);
        const period = startTimeStr.split(' ')[1]; // AM or PM
        
        // Convert to 24-hour format
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        
        const formattedStartTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // For end time, we can use the slot duration if available, otherwise assume 1 hour
        const slotDuration = (bookingDetails.daysInfo[0]?.slot as any)?.slot_duration || 60;
        const endHour = Math.floor(hour + slotDuration / 60);
        const endMinute = minute + (slotDuration % 60);
        const formattedEndTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        
        console.log("------- CREATING BOOKINGS -------");
        // For each day in the booking, create a separate booking entry
        const createdBookingIds = [];
        for (const dayInfo of bookingDetails.daysInfo) {
          if (dayInfo.slot?.id) {
            const bookingDate = format(new Date(dayInfo.date), 'yyyy-MM-dd');
            
            const bookingResult = await createBooking(
              userData,
              dayInfo.slot.id,
              bookingDate,
              formattedStartTime,
              formattedEndTime
            );
            
            // Store the booking ID for later use
            if (bookingResult && bookingResult.booking && bookingResult.booking.id) {
              createdBookingIds.push(bookingResult.booking.id);
              console.log(`Created booking for date: ${bookingDate}, slot: ${dayInfo.slot.id}, booking ID: ${bookingResult.booking.id}`);
            } else {
              console.log(`Created booking for date: ${bookingDate}, slot: ${dayInfo.slot.id}`);
            }
          }
        }
        
      return createdBookingIds;
      } catch (error) {
      console.error("Error creating bookings:", error);
      return [];
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Form submitted with values:", values);
    handlePhonePePayment(values);
  }

  // Testing function to simulate successful payment
  const simulateSuccessfulPayment = () => {
    const processBooking = async () => {
      try {
        // Get user data from localStorage
        const localStorageUserId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName') || 'Guest';
        const userEmail = localStorage.getItem('userEmail') || 'guest@example.com';
        const userPhone = localStorage.getItem('userPhone') || '';
        
        // Use the existing createBookingsInDatabase function
        const createdBookingIds = await createBookingsInDatabase();
        
        console.log("------- PAYMENT SUCCESS -------");
        console.log("User ID:", localStorageUserId || bookingDetails.id);
        console.log("User Name:", userName);
        console.log("User Email:", userEmail);
        console.log("Selected Time Slot:", bookingDetails.selectedTimeSlot);
        console.log("Selected Time Slot ID:", bookingDetails.selectedTimeSlotId);
        console.log("Base Slot ID:", bookingDetails.baseSlotId);
        console.log("Slot IDs for all days:", slotIds);
        console.log("Booking IDs:", createdBookingIds);
        console.log("-----------------------------");
        
        toast({
          title: "Payment successful",
          description: "Your booking has been confirmed.",
        });
        
        // Navigate to booking success page
        setTimeout(() => {
          navigate("/customer/booking-success", { 
            state: { 
              bookingDetails,
              paymentReference: `payment-${Date.now()}`,
              slotIds,
              bookingIds: createdBookingIds, // Pass the booking IDs to the success page
              userId: localStorageUserId || bookingDetails.id
            } 
          });
        }, 1500);
      } catch (error) {
        console.error("Error creating booking:", error);
        toast({
          title: "Error creating booking",
          description: "There was a problem confirming your booking. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    processBooking();
  }

  // Show verification loader when verifying payment
  if (isVerifying) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
                  <p className="text-muted-foreground mb-4">
                    Please wait while we confirm your payment with PhonePe...
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Checking payment status</p>
                    <p>• Creating your bookings</p>
                    <p>• Finalizing confirmation</p>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-700">
                    This usually takes a few seconds. Please do not refresh or close this page.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Secure Payment</h1>
          <p className="text-muted-foreground">Complete your booking with PhonePe</p>
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          <div className="md:col-span-3">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-purple-600" />
                  PhonePe Payment
                </CardTitle>
                <CardDescription>
                  Pay securely with PhonePe - UPI, Cards, and more
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="p-4 border border-purple-200 rounded-md bg-purple-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Smartphone className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-purple-800">PhonePe Test Environment</span>
                      </div>
                      <p className="text-sm text-purple-700 mb-2">
                        You'll be redirected to PhonePe sandbox for testing
                      </p>
                      <div className="text-xs text-purple-600 space-y-1">
                        <p><strong>Test UPI:</strong> success@ybl (for success)</p>
                        <p><strong>Test UPI:</strong> failure@ybl (for failure)</p>
                        <p><strong>Test Card:</strong> 4111 1111 1111 1111</p>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="mobileNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="9999999999" 
                              maxLength={10}
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "");
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            For faster checkout (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4 space-y-4">
                      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isProcessing}>
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating PhonePe Order...
                          </>
                        ) : (
                          <>
                            Pay ₹149.99 with PhonePe
                            <Smartphone className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                      
                      <div className="flex gap-4">
                        <Button 
                          type="button" 
                          className="w-1/2 bg-green-600 hover:bg-green-700 flex items-center gap-2"
                          onClick={simulateSuccessfulPayment}
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Payment Success
                        </Button>
                        <Button 
                          type="button" 
                          className="w-1/2 bg-red-600 hover:bg-red-700"
                          onClick={() => {
                            toast({
                              title: "Payment failed",
                              description: "There was an issue processing your payment. Please try again.",
                              variant: "destructive",
                            });
                            
                            // Navigate to payment fail page
                            navigate("/customer/payment-fail");
                          }}
                        >
                          Payment Fail
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <div className="font-medium mb-2">3-Day Swimming Analysis</div>
                    <div className="text-sm text-muted-foreground mb-1">
                      {format(new Date(bookingDetails.daysInfo[0]?.date || new Date()), "MMMM d")} - 
                      {format(new Date(bookingDetails.daysInfo[2]?.date || new Date(Date.now() + 172800000)), "MMMM d, yyyy")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {bookingDetails.selectedTimeSlot || "9:00 AM - 10:00 AM"}
                    </div>
                  </div>

                  {/* User Information Section */}
                  <div className="border-b pb-4">
                    <div className="font-medium mb-2">User Information</div>
                    <div className="text-sm text-muted-foreground">
                      Name: {localStorage.getItem('userName') || 'Not available'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Email: {localStorage.getItem('userEmail') || 'Not available'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      User ID: {localStorage.getItem('userId') || bookingDetails.id || 'Not available'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Experience: {localStorage.getItem('userSwimmingExperience') || 'Not available'}
                    </div>
                  </div>

                  <div className="border-b pb-4">
                    <div className="font-medium mb-2">Booking Information</div>
                    <div className="text-sm text-muted-foreground">
                      Time Slot: {bookingDetails.selectedTimeSlot}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Time Slot ID: {bookingDetails.selectedTimeSlotId ? bookingDetails.selectedTimeSlotId.substring(0, 10) + '...' : 'Not available'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Number of Days: {bookingDetails.daysInfo.length}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹149.99</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>₹0.00</span>
                    </div>
                    <div className="flex justify-between font-medium text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>₹149.99</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800 text-sm">Payment Options Available</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      UPI, Cards, Net Banking, Wallets & more through PhonePe
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start text-sm bg-muted/50 rounded-b-lg">
                <div className="flex gap-2 items-center mb-2">
                  <LockIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Secured Payment</span>
                </div>
                <p className="text-muted-foreground">
                  Your payment information is encrypted and secure. PhonePe handles all payment processing.
                </p>
              </CardFooter>
            </Card>

            <div className="mt-4 text-xs text-muted-foreground">
              <p>
                By proceeding with the payment, you agree to our terms and conditions. 
                All transactions are processed securely through PhonePe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
