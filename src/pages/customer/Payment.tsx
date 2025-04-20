
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Loader2, LockIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

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

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Payment successful",
        description: "Your booking has been confirmed.",
      });
      navigate("/customer/invoice/123"); // Navigate to the invoice page
    }, 2000);
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
                      April 22-24, 2023
                    </div>
                    <div className="text-sm text-muted-foreground">
                      9:00 AM - 10:00 AM
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
