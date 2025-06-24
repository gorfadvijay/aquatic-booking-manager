# Supabase Edge Functions Setup Guide

## ✅ What We've Implemented

You now have **Supabase Edge Functions** instead of Next.js API routes! Here's what's been set up:

### 🚀 Edge Functions Created:
1. **`create-payment-order`** - Creates PhonePe payment orders
2. **`payment-webhook`** - Handles PhonePe payment webhooks  
3. **`verify-payment`** - Verifies payment status

### 📁 File Structure:
```
supabase/
├── config.toml
└── functions/
    ├── create-payment-order/
    │   └── index.ts
    ├── payment-webhook/
    │   └── index.ts
    └── verify-payment/
        └── index.ts
```

## 🛠️ Local Testing Setup

### Step 1: Install Supabase CLI
```bash
npm install -g supabase
# or
npx supabase@latest --help
```

### Step 2: Start Local Supabase
```bash
npm run supabase:start
```

This will start:
- **API**: http://localhost:54321
- **Studio**: http://localhost:54323  
- **Edge Functions**: http://localhost:54327
- **Database**: localhost:54322

### Step 3: Set Environment Variables

Create `.env.local` in your project root:
```env
# Supabase
VITE_PUBLIC_SUPABASE_URL=http://localhost:54321
VITE_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_supabase_start

# PhonePe Test Configuration
VITE_PHONEPE_MERCHANT_ID=MERCHANTUAT
VITE_PHONEPE_SALT_KEY=f1fed176-917c-4c1b-b5ae-1e1d39e1f8d5
VITE_PHONEPE_SALT_INDEX=1
VITE_DEFAULT_PAYMENT_GATEWAY=phonepe
VITE_PRODUCTION_URL=http://localhost:5173
```

### Step 4: Serve Edge Functions Locally
```bash
npm run functions:serve
```

## 🧪 Testing Your Edge Functions

### Test Payment Order Creation:
```bash
curl -X POST http://localhost:54327/functions/v1/create-payment-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "bookingId": "test-booking-123",
    "amount": 100,
    "userDetails": {
      "id": "test-user-123",
      "name": "Test User",
      "email": "test@example.com", 
      "phone": "9999999999"
    }
  }'
```

### Test Payment Verification:
```bash
curl -X POST http://localhost:54327/functions/v1/verify-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "transactionId": "TXN_123456789"
  }'
```

## 🔄 Frontend Integration

Your `Payment.tsx` component has been updated to use Edge Functions:

```typescript
// Old way (doesn't work with Vite)
import { paymentGatewayService } from '@/lib/services/payment-gateway.service';

// New way (Edge Functions)
import { createPaymentOrder, verifyPayment } from '@/lib/services/api/phonepe-api.service';
```

## 🚀 Deployment to Production

### Step 1: Link Your Supabase Project
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

### Step 2: Deploy Edge Functions
```bash
npx supabase functions deploy create-payment-order
npx supabase functions deploy payment-webhook  
npx supabase functions deploy verify-payment
```

### Step 3: Set Production Environment Variables
```bash
npx supabase secrets set PHONEPE_MERCHANT_ID=YOUR_PROD_MERCHANT_ID
npx supabase secrets set PHONEPE_SALT_KEY=YOUR_PROD_SALT_KEY
npx supabase secrets set PHONEPE_SALT_INDEX=YOUR_PROD_SALT_INDEX
npx supabase secrets set PHONEPE_API_URL=https://api.phonepe.com/apis/hermes
npx supabase secrets set FRONTEND_URL=https://your-domain.com
```

## 🎯 Benefits of Edge Functions vs Express Server

| Feature | Edge Functions ✅ | Express Server ❌ |
|---------|------------------|------------------|
| **Serverless** | Auto-scaling | Manual scaling |
| **Cost** | Pay per request | Always running |
| **Deployment** | One command | Complex setup |
| **Integration** | Native Supabase | External hosting |
| **Maintenance** | Minimal | High |

## 🔍 Debugging

### View Function Logs:
```bash
npx supabase functions logs create-payment-order
npx supabase functions logs payment-webhook
npx supabase functions logs verify-payment
```

### Test in Browser Console:
```javascript
// Test payment flow
import { testPaymentFlow } from '@/lib/services/api/phonepe-api.service';
testPaymentFlow();
```

## 🛡️ Security Features

✅ **CORS Headers** - Properly configured  
✅ **Request Validation** - JSON schema validation  
✅ **Error Handling** - Comprehensive error responses  
✅ **Authentication** - Supabase auth integration ready  
✅ **Environment Variables** - Secure secret management  

## 📝 Next Steps

1. **Start local development**: `npm run supabase:start`
2. **Serve functions**: `npm run functions:serve`  
3. **Test payments**: Use the frontend or curl commands
4. **Deploy when ready**: Follow deployment steps above

Your payment system is now **production-ready** with Supabase Edge Functions! 🎉 