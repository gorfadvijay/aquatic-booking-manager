# PhonePe Integration Guide

## Overview

This document provides a comprehensive guide for integrating PhonePe payment gateway into the Aquatic Booking Manager application using **local API routes** that are production-ready.

## Architecture Decision: Local API Routes vs Supabase Edge Functions

### **Recommended: Local API Routes (`src/app/api/`)**

For this project, we recommend using local API routes because:

✅ **Consistency** - Matches your existing Razorpay integration pattern  
✅ **Simplicity** - No additional deployment complexity  
✅ **Development Speed** - Faster iteration and debugging  
✅ **Team Familiarity** - Uses your existing React/Vite setup  
✅ **Direct Integration** - Works seamlessly with your existing services  

**Production Security Measures:**
- Environment variables for sensitive credentials
- Server-side signature validation
- Webhook URL protection with reverse proxy/CDN
- Request rate limiting and validation

### **Alternative: Supabase Edge Functions**

If you need maximum security and global scaling, Edge Functions are available:

```
supabase/functions/
├── phonepe-create-order/
├── phonepe-verify-payment/
└── phonepe-webhook/
```

*Note: This guide focuses on local API routes. Edge Functions setup is available upon request.*

## Folder Structure

The PhonePe integration follows a clean, modular architecture that mirrors the existing Razorpay pattern:

```
src/
├── app/api/phonepe/                 # API routes for PhonePe (Recommended)
│   ├── create-order/
│   │   └── index.ts                 # Creates payment orders
│   ├── verify-payment/
│   │   └── index.ts                 # Verifies payment status
│   └── webhook/
│       └── index.ts                 # Handles PhonePe webhooks
├── lib/services/
│   ├── api/
│   │   └── phonepe-api.service.ts   # Low-level PhonePe API wrapper
│   └── payment-gateway.service.ts   # Gateway abstraction layer
└── pages/customer/
    └── PaymentPhonePe.tsx           # Example payment component
```

## Production Deployment Considerations

### **1. Environment Variables**

Add these environment variables to your deployment platform:

```env
# PhonePe Configuration
PHONEPE_MERCHANT_ID=your_merchant_id_here
PHONEPE_SALT_KEY=your_salt_key_here
PHONEPE_SALT_INDEX=1

# Application URLs
PRODUCTION_URL=https://your-domain.com
DEFAULT_PAYMENT_GATEWAY=phonepe

# Environment (affects PhonePe API URLs)
NODE_ENV=production
```

### **2. Webhook URL Setup**

Your webhook URL will be: `https://your-domain.com/api/phonepe/webhook`

**Security Requirements:**
- Must be HTTPS in production
- Should implement rate limiting
- Consider using a CDN/reverse proxy for DDoS protection

### **3. API Route Deployment**

Your current Vite setup should handle the API routes automatically. Ensure:
- Routes are accessible at build time
- Environment variables are properly injected
- CORS is configured for your domain

## Environment Variables

Add these environment variables to your `.env` file:

```env
# PhonePe Configuration
PHONEPE_MERCHANT_ID=your_merchant_id_here
PHONEPE_SALT_KEY=your_salt_key_here
PHONEPE_SALT_INDEX=1

# Application URLs
PRODUCTION_URL=https://your-domain.com
DEFAULT_PAYMENT_GATEWAY=phonepe

# Environment (affects PhonePe API URLs)
NODE_ENV=development  # or production
```

## PhonePe Credentials Setup

1. **Register with PhonePe Business**
   - Visit [PhonePe Business Portal](https://business.phonepe.com/)
   - Complete merchant registration
   - Get your Merchant ID and Salt Key

2. **Sandbox vs Production**
   - Development: Uses `https://api-preprod.phonepe.com/apis/pg-sandbox`
   - Production: Uses `https://api.phonepe.com/apis/hermes`

3. **Configure Webhook URL**
   - Set webhook URL in PhonePe dashboard: `https://your-domain.com/api/phonepe/webhook`
   - Ensure URL is publicly accessible

## Integration Components

### 1. PhonePe API Service (`phonepe-api.service.ts`)

Handles low-level PhonePe API interactions:
- Payment initiation
- Status verification  
- Webhook signature validation

Key features:
- Automatic environment detection (sandbox/production)
- SHA256 signature generation
- Base64 payload encoding

### 2. API Routes

#### Create Order (`/api/phonepe/create-order`)
- **Method**: POST
- **Purpose**: Initiates payment with PhonePe
- **Request**: 
  ```json
  {
    "bookingId": "booking_123",
    "amount": 149.99,
    "currency": "INR",
    "mobileNumber": "9876543210"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "orderId": "payment_456",
    "redirectUrl": "https://phonepe.com/...",
    "merchantTransactionId": "TXN_..."
  }
  ```

#### Verify Payment (`/api/phonepe/verify-payment`)
- **Method**: POST/GET
- **Purpose**: Verifies payment status
- **Usage**: Called when user returns from PhonePe

#### Webhook (`/api/phonepe/webhook`)
- **Method**: POST
- **Purpose**: Receives server-to-server payment confirmations
- **Security**: Validates signature before processing

### 3. Payment Gateway Service (`payment-gateway.service.ts`)

Provides unified interface for multiple payment gateways:
- Supports both PhonePe and Razorpay
- Gateway-agnostic payment flow
- Configurable default gateway

### 4. Frontend Component (`PaymentPhonePe.tsx`)

Example implementation showing:
- Gateway selection (PhonePe/Razorpay)
- Payment initiation
- Redirect handling
- Payment verification

## Usage Example

### Basic Payment Flow

```typescript
import { paymentGatewayService } from '@/lib/services/payment-gateway.service';

// Create payment order
const orderResponse = await paymentGatewayService.createOrder({
  bookingId: 'booking_123',
  amount: 149.99,
  currency: 'INR',
  mobileNumber: '9876543210'
}, 'phonepe');

// Redirect user to PhonePe
if (orderResponse.redirectUrl) {
  window.location.href = orderResponse.redirectUrl;
}

// Verify payment (on return)
const verificationResponse = await paymentGatewayService.verifyPayment({
  gateway: 'phonepe',
  transactionId: 'phonepe_txn_id',
  merchantTransactionId: 'merchant_txn_id'
});
```

### Gateway Selection

```tsx
const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('phonepe');

// Use different gateways
const handlePayment = async () => {
  const response = await paymentGatewayService.createOrder(
    paymentData, 
    selectedGateway
  );
  // Handle response based on gateway
};
```

## Security Considerations

1. **Webhook Signature Validation**
   - Always verify webhook signatures
   - Use the provided `verifyWebhookSignature` method

2. **Environment Separation**
   - Use sandbox for development/testing
   - Switch to production URLs only for live environment

3. **Credential Management**
   - Store sensitive keys in environment variables
   - Never commit credentials to version control

4. **Production Security**
   - Use HTTPS for all webhook URLs
   - Implement request rate limiting
   - Consider using a reverse proxy/CDN
   - Monitor for suspicious payment patterns

## Testing

### Development Testing
1. Use PhonePe sandbox environment
2. Test with small amounts (₹1)
3. Verify webhook reception using tools like ngrok for local testing

### Production Checklist
- [ ] PhonePe merchant account approved
- [ ] Production credentials configured
- [ ] Webhook URL whitelisted and accessible
- [ ] SSL certificate valid
- [ ] Test transactions successful
- [ ] Rate limiting configured
- [ ] Monitoring and logging in place

## Payment States

### PhonePe Payment States
- `PENDING`: Payment initiated
- `COMPLETED`: Payment successful
- `FAILED`: Payment failed

### Application Payment Status
- `pending`: Initial state
- `success`: Payment completed
- `failed`: Payment failed
- `refunded`: Payment refunded

## Error Handling

The integration includes comprehensive error handling:
- Network failures
- Invalid signatures
- Payment failures
- Booking creation errors

## Support & Debugging

### Common Issues
1. **Invalid Signature**: Check salt key and index
2. **Webhook Not Received**: Verify URL accessibility
3. **Payment Stuck in Pending**: Check PhonePe dashboard
4. **CORS Errors**: Ensure proper domain configuration

### Logging
- All payment events are logged to console
- Webhook events include detailed payment information
- Error details are captured for debugging

## Local Development with Webhooks

Since webhooks need public URLs, use these tools for local testing:

### **Option 1: ngrok (Recommended)**
```bash
npm install -g ngrok
ngrok http 5173
# Use the generated HTTPS URL for webhook configuration
```

### **Option 2: Cloudflare Tunnel**
```bash
npm install -g cloudflared
cloudflared tunnel --url http://localhost:5173
```

### **Option 3: VS Code Port Forwarding**
- Use VS Code's built-in port forwarding feature
- Make port 5173 public
- Use the generated URL for webhooks

## Migration from Single Gateway

If migrating from Razorpay-only:
1. Install new PhonePe services
2. Update payment components to use `payment-gateway.service.ts`
3. Configure environment variables
4. Test thoroughly in sandbox

## When to Consider Supabase Edge Functions

Consider migrating to Edge Functions if you need:
- **Maximum security** for payment processing
- **Global edge deployment** for better performance
- **Independent scaling** of payment functions
- **Compliance requirements** that mandate server-side processing

This integration maintains backward compatibility while adding PhonePe support alongside existing Razorpay functionality using your current architecture. 