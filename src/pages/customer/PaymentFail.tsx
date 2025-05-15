import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";

const PaymentFail = () => {
  const navigate = useNavigate();

  const handleTryAgain = () => {
    // Navigate back to the payment page
    navigate("/customer/payment");
  };

  const handleBackToBooking = () => {
    // Navigate back to the booking page
    navigate("/customer/book");
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Payment Failed</h1>
          <p className="text-muted-foreground">
            We were unable to process your payment at this time.
          </p>
        </div>

        <Card className="shadow-md mb-6">
          <CardHeader>
            <CardTitle>What Happened?</CardTitle>
            <CardDescription>
              Your payment could not be processed due to one of the following reasons:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ul className="list-disc pl-5 space-y-2">
                <li>Your card was declined by the issuing bank</li>
                <li>Insufficient funds in your account</li>
                <li>The payment information provided was incorrect</li>
                <li>There was a technical issue with the payment gateway</li>
                <li>Your card may have expired or been canceled</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 flex flex-col items-start">
            <p className="text-sm text-muted-foreground">
              No payment has been taken from your account. You can try again with the same or a different payment method.
            </p>
          </CardFooter>
        </Card>

        <div className="text-center space-y-3">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleTryAgain} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Payment Again
            </Button>
            <Button onClick={handleBackToBooking} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Booking
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFail; 