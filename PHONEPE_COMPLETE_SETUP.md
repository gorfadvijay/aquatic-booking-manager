# PhonePe Complete Integration Setup

This guide covers the complete PhonePe payment integration for your Aquatic Booking Manager, including the separate backend and frontend integration.

## 📁 Project Structure

```
├── aquatic-booking-manager/          # Frontend React app
│   ├── src/
│   │   ├── lib/
│   │   │   ├── environment.ts        # Updated with backend URL
│   │   │   └── services/
│   │   │       └── phonepe-backend.service.ts  # New backend communication
│   │   └── pages/customer/
│   └── ...
└── Backend/                          # New PhonePe backend
    ├── src/
    │   ├── config/
    │   ├── services/
    │   ├── routes/
    │   ├── middleware/
    │   └── server.js
    ├── package.json
    ├── README.md
    └── QUICK_START.md
```

## 🚀 Backend Setup

### 1. Navigate to Backend Directory
```bash
cd Backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment File
Create a `.env` file in the Backend directory:
```env
# PhonePe Configuration
PHONEPE_ENVIRONMENT=UAT
PHONEPE_CLIENT_ID=your_actual_client_id_here
PHONEPE_CLIENT_SECRET=your_actual_client_secret_here
PHONEPE_CLIENT_VERSION=1

# Test Merchant Credentials
PHONEPE_MERCHANT_ID=TEST-M2342E2P0D51P_25061
PHONEPE_SALT_KEY=ZWE1NTZiYWEtZGIwYS00YjQ1LTk4MmUtMDY5ZjM3N2Y3NGJh
PHONEPE_SALT_INDEX=1

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Webhook Configuration
WEBHOOK_SECRET=your_webhook_secret_here
```

**⚠️ Important**: You need to get actual `PHONEPE_CLIENT_ID` and `PHONEPE_CLIENT_SECRET` from PhonePe.

### 4. Start Backend Server
```bash
# Development mode with auto-reload
npm run dev
```

### 5. Verify Backend
Visit `http://localhost:5000` - you should see API documentation.

## 🎯 Frontend Integration

### 1. Environment Configuration
In your frontend project, create/update `.env`:
```env
# Add this line to your existing .env
VITE_PHONEPE_BACKEND_URL=http://localhost:5000
```

### 2. Update Payment Component

Here's how to integrate PhonePe into your existing payment flow:

```tsx
// src/pages/customer/Payment.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import phonePeBackendService from '@/lib/services/phonepe-backend.service';

interface PaymentProps {
  booking: {
    id: string;
    amount: number;
    customerEmail: string;
  };
}

export const Payment: React.FC<PaymentProps> = ({ booking }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'phonepe' | 'razorpay'>('phonepe');

  const handlePhonePePayment = async () => {
    setIsLoading(true);
    try {
      const successUrl = `${window.location.origin}/payment-success?orderId=${booking.id}`;
      
      await phonePeBackendService.initiatePayment(
        booking.amount, // Amount in INR
        successUrl,
        booking.id,
        booking.customerEmail
      );
      
      // User will be redirected to PhonePe
    } catch (error) {
      console.error('PhonePe payment failed:', error);
      alert('Payment initiation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRazorpayPayment = () => {
    // Your existing Razorpay logic
    console.log('Razorpay payment not implemented yet');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Method Selection */}
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                value="phonepe"
                checked={paymentMethod === 'phonepe'}
                onChange={(e) => setPaymentMethod(e.target.value as 'phonepe')}
                className="w-4 h-4"
              />
              <span className="font-medium">PhonePe</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                value="razorpay"
                checked={paymentMethod === 'razorpay'}
                onChange={(e) => setPaymentMethod(e.target.value as 'razorpay')}
                className="w-4 h-4"
              />
              <span className="font-medium">Razorpay</span>
            </label>
          </div>

          {/* Payment Button */}
          <Button
            onClick={paymentMethod === 'phonepe' ? handlePhonePePayment : handleRazorpayPayment}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Processing...' : `Pay ₹${booking.amount} with ${paymentMethod === 'phonepe' ? 'PhonePe' : 'Razorpay'}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
```

### 3. Create Payment Success Page

```tsx
// src/pages/customer/PaymentSuccess.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import phonePeBackendService from '@/lib/services/phonepe-backend.service';

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<{
    loading: boolean;
    success: boolean;
    message: string;
    data?: any;
  }>({
    loading: true,
    success: false,
    message: 'Verifying payment...'
  });

  useEffect(() => {
    const verifyPayment = async () => {
      const merchantOrderId = searchParams.get('merchantOrderId');
      const orderId = searchParams.get('orderId');

      if (!merchantOrderId && !orderId) {
        setPaymentStatus({
          loading: false,
          success: false,
          message: 'Invalid payment reference'
        });
        return;
      }

      try {
        const result = await phonePeBackendService.handlePaymentReturn(
          merchantOrderId || orderId || ''
        );

        setPaymentStatus({
          loading: false,
          success: result.success,
          message: result.message,
          data: result.data
        });

        // If payment successful, you might want to:
        // 1. Update booking status
        // 2. Send confirmation email
        // 3. Generate invoice
        if (result.success) {
          // Update your booking status here
          console.log('Payment successful, update booking status');
        }
      } catch (error) {
        setPaymentStatus({
          loading: false,
          success: false,
          message: 'Payment verification failed'
        });
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (paymentStatus.loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Verifying your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className={`text-center ${paymentStatus.success ? 'text-green-600' : 'text-red-600'}`}>
            {paymentStatus.success ? '✅ Payment Successful' : '❌ Payment Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center">{paymentStatus.message}</p>
          
          {paymentStatus.success && paymentStatus.data && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p><strong>Transaction ID:</strong> {paymentStatus.data.transactionId}</p>
              <p><strong>Amount:</strong> ₹{paymentStatus.data.amount / 100}</p>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={() => navigate('/bookings')}
              className="flex-1"
            >
              View Bookings
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="flex-1"
            >
              Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

### 4. Update Router
Add the new route to your router configuration:

```tsx
// In your router configuration
import { PaymentSuccess } from '@/pages/customer/PaymentSuccess';

// Add this route
{
  path: "/payment-success",
  element: <PaymentSuccess />
}
```

## 🧪 Testing the Integration

### 1. Start Both Servers
```bash
# Terminal 1: Start backend
cd Backend
npm run dev

# Terminal 2: Start frontend
cd aquatic-booking-manager
npm run dev
```

### 2. Test Payment Flow
1. Go to your booking/payment page
2. Select PhonePe as payment method
3. Click "Pay with PhonePe"
4. You should be redirected to PhonePe test page
5. Complete the payment in PhonePe test app
6. You'll be redirected back to your success page

### 3. Backend Testing
Test backend directly:
```bash
# Health check
curl http://localhost:5000/health

# Create test payment
curl -X POST http://localhost:5000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "redirectUrl": "http://localhost:5173/payment-success"
  }'
```

## 🔐 Security Considerations

### Backend Security
- ✅ Rate limiting implemented
- ✅ CORS protection
- ✅ Input validation
- ✅ Webhook signature verification
- ✅ Security headers

### Frontend Security
- ✅ Environment variables for sensitive config
- ✅ Error handling
- ✅ Payment verification on return

## 🌍 Production Deployment

### Backend Production Setup
1. **Environment Variables**:
   ```env
   NODE_ENV=production
   PHONEPE_ENVIRONMENT=PROD
   PHONEPE_CLIENT_ID=your_production_client_id
   PHONEPE_CLIENT_SECRET=your_production_client_secret
   PHONEPE_MERCHANT_ID=your_production_merchant_id
   PHONEPE_SALT_KEY=your_production_salt_key
   PHONEPE_SALT_INDEX=your_production_salt_index
   FRONTEND_URL=https://yourdomain.com
   ```

2. **Deploy Backend**: Deploy to your preferred platform (Heroku, AWS, DigitalOcean, etc.)

3. **Update Frontend Environment**:
   ```env
   VITE_PHONEPE_BACKEND_URL=https://your-backend-domain.com
   ```

### Webhook Configuration
1. In PhonePe merchant dashboard, set webhook URL to:
   ```
   https://your-backend-domain.com/api/payment/webhook
   ```

2. Ensure your backend is accessible from PhonePe servers

## 🔍 Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Verify your PhonePe client credentials
   - Check environment variables

2. **"CORS error"**
   - Ensure frontend URL is in backend CORS config
   - Check `FRONTEND_URL` in backend `.env`

3. **"Backend unreachable"**
   - Verify backend is running on port 5000
   - Check `VITE_PHONEPE_BACKEND_URL` in frontend

4. **Payment not redirecting**
   - Check redirect URL format
   - Ensure success page route exists

### Logs to Check
- Backend console for API logs
- Browser network tab for request/response
- PhonePe merchant dashboard for transaction logs

## 📞 Support

1. **PhonePe Documentation**: [Official PhonePe Docs](https://developer.phonepe.com/)
2. **Backend Issues**: Check `Backend/README.md`
3. **Frontend Issues**: Check existing payment implementation

---

## ✅ Setup Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 5173
- [ ] Environment variables configured
- [ ] PhonePe credentials obtained
- [ ] Payment flow tested end-to-end
- [ ] Success page implemented
- [ ] Error handling in place
- [ ] Webhook URL configured (for production)

**You now have a complete PhonePe integration with your own secure backend following official PhonePe documentation!** 