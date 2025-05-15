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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, LockIcon, DatabaseIcon, CheckCircleIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { createBooking } from "@/lib/services/api/booking-api.service";

const formSchema = z.object({
  paymentMethod: z.enum(["card", "paypal"]),
  cardholderName: z.string().optional(),
  cardNumber: z
    .string()
    .regex(/^\d{16}$/, "Card number must be 16 digits")
    .optional(),
  expiryMonth: z.string().optional(),
  expiryYear: z.string().optional(),
  cvv: z
    .string()
    .regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits")
    .optional(),
});

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: "card",
      cardholderName: "",
      cardNumber: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
    },
  });

  const paymentMethod = form.watch("paymentMethod");

  // For credit card input formatting
  const formatCardNumber = (value: string) => {
    // Remove any non-digits
    const digits = value.replace(/\D/g, "");
    // Limit to 16 digits
    const limitedDigits = digits.slice(0, 16);
    return limitedDigits;
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    setIsProcessing(true);

    // Get user data from localStorage
    const localStorageUserId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName') || 'Guest';
    const userEmail = localStorage.getItem('userEmail') || 'guest@example.com';
    const userPhone = localStorage.getItem('userPhone') || '';
    
    // Create a booking in the database
    const processBooking = async () => {
      try {
        // Prepare user data
        const userData = {
          name: userName,
          email: userEmail,
          phone: userPhone,
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
        for (const dayInfo of bookingDetails.daysInfo) {
          if (dayInfo.slot?.id) {
            const bookingDate = format(new Date(dayInfo.date), 'yyyy-MM-dd');
            
            await createBooking(
              userData,
              dayInfo.slot.id,
              bookingDate,
              formattedStartTime,
              formattedEndTime
            );
            
            console.log(`Created booking for date: ${bookingDate}, slot: ${dayInfo.slot.id}`);
          }
        }
        
        console.log("------- PAYMENT SUCCESS -------");
        console.log("User ID:", localStorageUserId || bookingDetails.id);
        console.log("User Name:", userName);
        console.log("User Email:", userEmail);
        console.log("Selected Time Slot:", bookingDetails.selectedTimeSlot);
        console.log("Selected Time Slot ID:", bookingDetails.selectedTimeSlotId);
        console.log("Base Slot ID:", bookingDetails.baseSlotId);
        console.log("Slot IDs for all days:", slotIds);
        console.log("-----------------------------");
        
        toast({
          title: "Payment successful",
          description: "Your booking has been confirmed.",
        });
        
        // Navigate to booking success page after a short delay
        setTimeout(() => {
          navigate("/customer/booking-success", { 
            state: { 
              bookingDetails,
              paymentReference: `payment-${Date.now()}`,
              slotIds,
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

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Secure Payment</h1>
          <p className="text-muted-foreground">Complete your booking by making a payment</p>
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          <div className="md:col-span-3">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Choose how you would like to pay</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-3"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-4">
                                <FormControl>
                                  <RadioGroupItem value="card" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer flex-1">
                                  Credit / Debit Card
                                </FormLabel>
                                <div className="flex gap-2">
                                  <div className="h-8 w-12 bg-gray-100 rounded flex items-center justify-center text-xs">VISA</div>
                                  <div className="h-8 w-12 bg-gray-100 rounded flex items-center justify-center text-xs">MC</div>
                                  <div className="h-8 w-12 bg-gray-100 rounded flex items-center justify-center text-xs">AMEX</div>
                                </div>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-4">
                                <FormControl>
                                  <RadioGroupItem value="paypal" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer flex-1">
                                  PayPal
                                </FormLabel>
                                <div className="h-8 w-16 bg-gray-100 rounded flex items-center justify-center text-xs">PayPal</div>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {paymentMethod === "card" && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="cardholderName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cardholder Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="cardNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Card Number</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="1234 5678 9012 3456" 
                                  {...field}
                                  value={formatCardNumber(field.value || "")}
                                  onChange={(e) => {
                                    const formattedValue = formatCardNumber(e.target.value);
                                    field.onChange(formattedValue);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="expiryMonth"
                            render={({ field }) => (
                              <FormItem className="col-span-1">
                                <FormLabel>Month</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="MM" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => {
                                      const month = (i + 1).toString().padStart(2, "0");
                                      return (
                                        <SelectItem key={month} value={month}>
                                          {month}
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="expiryYear"
                            render={({ field }) => (
                              <FormItem className="col-span-1">
                                <FormLabel>Year</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="YY" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Array.from({ length: 10 }, (_, i) => {
                                      const year = (new Date().getFullYear() + i).toString().substring(2);
                                      return (
                                        <SelectItem key={year} value={year}>
                                          {year}
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="cvv"
                            render={({ field }) => (
                              <FormItem className="col-span-1">
                                <FormLabel>CVV</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="123"
                                    maxLength={4}
                                    {...field}
                                    onChange={(e) => {
                                      // Only allow digits
                                      const value = e.target.value.replace(/\D/g, "");
                                      field.onChange(value);
                                    }}
                                  />
                                </FormControl>
                                <FormDescription className="text-xs">
                                  3 or 4 digits on back of card
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === "paypal" && (
                      <div className="p-6 border border-border rounded-md bg-gray-50 text-center">
                        <p className="text-muted-foreground mb-4">
                          You will be redirected to PayPal to complete your payment
                        </p>
                        <div className="h-12 w-24 bg-gray-200 rounded mx-auto flex items-center justify-center text-sm">
                          PayPal
                        </div>
                      </div>
                    )}

                    <div className="pt-4">
                      <Button type="submit" className="w-full" disabled={isProcessing}>
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Pay $149.99
                            <LockIcon className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                      
                      <div className="flex gap-4 mt-4">
                        <Button 
                          type="button" 
                          className="w-1/2 bg-green-600 hover:bg-green-700 flex items-center gap-2"
                          onClick={() => {
                            // Get user data from localStorage
                            const localStorageUserId = localStorage.getItem('userId');
                            const userName = localStorage.getItem('userName') || 'Guest';
                            const userEmail = localStorage.getItem('userEmail') || 'guest@example.com';
                            const userPhone = localStorage.getItem('userPhone') || '';
                            
                            // Create a booking in the database
                            const processBooking = async () => {
                              try {
                                // Prepare user data
                                const userData = {
                                  name: userName,
                                  email: userEmail,
                                  phone: userPhone,
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
                                for (const dayInfo of bookingDetails.daysInfo) {
                                  if (dayInfo.slot?.id) {
                                    const bookingDate = format(new Date(dayInfo.date), 'yyyy-MM-dd');
                                    
                                    await createBooking(
                                      userData,
                                      dayInfo.slot.id,
                                      bookingDate,
                                      formattedStartTime,
                                      formattedEndTime
                                    );
                                    
                                    console.log(`Created booking for date: ${bookingDate}, slot: ${dayInfo.slot.id}`);
                                  }
                                }
                                
                                console.log("------- PAYMENT SUCCESS -------");
                                console.log("User ID:", localStorageUserId || bookingDetails.id);
                                console.log("User Name:", userName);
                                console.log("User Email:", userEmail);
                                console.log("Selected Time Slot:", bookingDetails.selectedTimeSlot);
                                console.log("Selected Time Slot ID:", bookingDetails.selectedTimeSlotId);
                                console.log("Base Slot ID:", bookingDetails.baseSlotId);
                                console.log("Slot IDs for all days:", slotIds);
                                console.log("-----------------------------");
                                
                                toast({
                                  title: "Payment successful",
                                  description: "Your booking has been confirmed.",
                                });
                                
                                // Navigate to booking success page
                                navigate("/customer/booking-success", { 
                                  state: { 
                                    bookingDetails,
                                    paymentReference: `payment-${Date.now()}`,
                                    slotIds,
                                    userId: localStorageUserId || bookingDetails.id
                                  } 
                                });
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
                          }}
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
                      <span>$149.99</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>$0.00</span>
                    </div>
                    <div className="flex justify-between font-medium text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>$149.99</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start text-sm bg-muted/50 rounded-b-lg">
                <div className="flex gap-2 items-center mb-2">
                  <LockIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Secured Payment</span>
                </div>
                <p className="text-muted-foreground">
                  Your payment information is encrypted and secure. We do not store your credit card details.
                </p>
              </CardFooter>
            </Card>

            <div className="mt-4 text-xs text-muted-foreground">
              <p>
                By proceeding with the payment, you agree to our{" "}
                <a href="#" className="text-primary hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary hover:underline">
                  Cancellation Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
