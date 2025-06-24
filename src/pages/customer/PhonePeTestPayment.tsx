import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Smartphone, CheckCircle, XCircle, AlertCircle, Info, ExternalLink } from "lucide-react";
import { paymentGatewayService } from "@/lib/services/payment-gateway.service";
import { env } from "@/lib/environment";

const PhonePeTestPayment = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [testAmount, setTestAmount] = useState("1");
  const [mobileNumber, setMobileNumber] = useState("9999999999");
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testData, setTestData] = useState({
    bookingId: 'test-booking-123',
    amount: 149.99,
    mobileNumber: '9999999999'
  });
  const [lastError, setLastError] = useState<any>(null);

  const handleTestPayment = async () => {
    setIsLoading(true);
    setLastResponse(null);
    setLastError(null);

    try {
      console.log('Testing PhonePe payment with data:', testData);
      console.log('Current PhonePe config:', {
        merchantId: env.phonePe.merchantId,
        apiUrl: env.phonePe.apiUrl,
        saltKeyLength: env.phonePe.saltKey.length
      });
      
      const paymentResponse = await paymentGatewayService.createOrder({
        bookingId: testData.bookingId,
        amount: testData.amount,
        mobileNumber: testData.mobileNumber
      }, 'phonepe');

      console.log('PhonePe response:', paymentResponse);

      if (paymentResponse.success && paymentResponse.redirectUrl) {
        toast({
          title: "Test Payment Created! 🎉",
          description: `Redirecting to PhonePe...`,
        });
        
        // Redirect to PhonePe
        window.location.href = paymentResponse.redirectUrl;
      } else {
        throw new Error('Failed to create payment order');
      }
    } catch (error: any) {
      console.error('PhonePe test error:', error);
      setLastError(error);
      
      toast({
        title: "Test Payment Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTestPayment = async () => {
    const testData = localStorage.getItem('phonePeTestPayment');
    if (!testData) {
      toast({
        title: "No Test Payment Found",
        description: "Please create a test payment first",
        variant: "destructive",
      });
      return;
    }

    try {
      const { merchantTransactionId } = JSON.parse(testData);
      
      const verificationResponse = await paymentGatewayService.verifyPayment({
        gateway: 'phonepe',
        transactionId: merchantTransactionId,
        merchantTransactionId: merchantTransactionId
      });

      console.log("🔍 Verification Response:", verificationResponse);
      setLastResponse(verificationResponse);

      toast({
        title: verificationResponse.success ? "Payment Verified! ✅" : "Payment Failed ❌",
        description: `Status: ${verificationResponse.status}`,
        variant: verificationResponse.success ? "default" : "destructive",
      });

    } catch (error) {
      console.error("❌ Verification Error:", error);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const isValidCredentials = env.phonePe.merchantId !== 'MERCHANTUAT' || 
                            env.phonePe.saltKey !== 'f1fed176-917c-4c1b-b5ae-1e1d39e1f8d5';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-purple-600" />
              PhonePe Test Environment
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Testing with Merchant ID: <code>{env.phonePe.merchantId}</code>
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Credential Status */}
            <Alert className={`mb-4 ${isValidCredentials ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Current Credentials Status</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  <p><strong>Merchant ID:</strong> {env.phonePe.merchantId}</p>
                  <p><strong>API URL:</strong> {env.phonePe.apiUrl}</p>
                  <p><strong>Salt Key:</strong> {env.phonePe.saltKey.substring(0, 20)}...</p>
                  {!isValidCredentials && (
                    <div className="mt-3 p-3 bg-yellow-100 rounded-md">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Using default test credentials. These may not work and could result in "KEY_NOT_CONFIGURED" error.
                      </p>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            {/* Test Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Test Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  max="100"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="9999999999"
                />
              </div>
            </div>

            {/* Test Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={handleTestPayment} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Test Payment...
                  </>
                ) : (
                  <>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Test PhonePe Payment
                  </>
                )}
              </Button>

              <Button 
                variant="outline" 
                onClick={handleVerifyTestPayment}
                disabled={isProcessing}
              >
                Verify Last Payment
              </Button>
            </div>

            {/* Test Credentials Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📋 Test Payment Methods</h3>
              <div className="text-sm space-y-1">
                <p><strong>Success UPI:</strong> success@ybl</p>
                <p><strong>Failure UPI:</strong> failure@ybl</p>
                <p><strong>Success Card:</strong> 4111 1111 1111 1111 (CVV: 123)</p>
                <p><strong>Success Mobile:</strong> +91 9999999999</p>
              </div>
            </div>

            {/* Response Display */}
            {lastResponse && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  {lastResponse.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  Last API Response
                </h3>
                <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                  {JSON.stringify(lastResponse, null, 2)}
                </pre>
              </div>
            )}

            {/* Test Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">🧪 Testing Steps</h3>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Click "Test PhonePe Payment" to create a test order</li>
                <li>You'll be redirected to PhonePe sandbox</li>
                <li>Use test UPI ID <code>success@ybl</code> for successful payment</li>
                <li>Complete the payment flow</li>
                <li>Return to app and check webhook reception</li>
                <li>Use "Verify Last Payment" to check status</li>
              </ol>
            </div>

            {/* Webhook Status */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">🔗 Webhook Setup</h3>
              <p className="text-sm mb-2">
                For testing webhooks locally, expose your server using:
              </p>
              <code className="bg-white p-2 rounded border block text-xs">
                ngrok http 5173
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                Configure the generated HTTPS URL in PhonePe dashboard
              </p>
            </div>

            {/* Error Display */}
            {lastError && (
              <Alert className="border-red-200 bg-red-50 mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription>
                  <div className="mt-2">
                    <p><strong>Message:</strong> {lastError.message}</p>
                    {lastError.response && (
                      <div className="mt-2">
                        <p><strong>Response:</strong></p>
                        <pre className="text-xs bg-red-100 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(lastError.response, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-6 w-6 text-blue-600" />
              How to Get Valid PhonePe Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4" />
              <AlertTitle>Credential Issue: "KEY_NOT_CONFIGURED"</AlertTitle>
              <AlertDescription>
                This error means PhonePe cannot find your merchant configuration. You need valid test credentials from PhonePe.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-semibold">Steps to get valid credentials:</h4>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">1</span>
                  <div>
                    <p className="font-medium">Contact PhonePe Integration Team</p>
                    <p className="text-sm text-gray-600">Email: developer@phonepe.com</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">2</span>
                  <div>
                    <p className="font-medium">Request UAT Credentials</p>
                    <p className="text-sm text-gray-600">Ask for test merchant ID and salt keys for UAT environment</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">3</span>
                  <div>
                    <p className="font-medium">Update Environment Variables</p>
                    <p className="text-sm text-gray-600">Add the credentials to your .env file</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button variant="outline" className="w-full" asChild>
                <a href="https://developer.phonepe.com/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit PhonePe Developer Portal
                </a>
              </Button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold mb-2">Current Test Limits (Once you have valid credentials):</h5>
              <ul className="text-sm space-y-1">
                <li>• Amount Range: ₹1 - ₹1000</li>
                <li>• Test Mobile: 8296000000</li>
                <li>• Test OTP: 123456</li>
                <li>• Environment: UAT Sandbox</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PhonePeTestPayment; 