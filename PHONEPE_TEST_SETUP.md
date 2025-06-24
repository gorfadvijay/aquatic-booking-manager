# PhonePe Test Environment Setup

## Test Credentials Configured

Your PhonePe test environment is now configured with:

```
CLIENT ID (Merchant ID): TEST-M2342E2P0D51P_25061
KEY (Salt Key): ZWE1NTZiYWEtZGIwYS00YjQ1LTk4MmUtMDY5ZjM3N2Y3NGJh
Salt Index: 1
Environment: TEST/SANDBOX
API URL: https://api-preprod.phonepe.com/apis/pg-sandbox
```

## Environment Variables for Testing

Create a `.env.local` file in your project root with:

```env
# PhonePe Test Configuration (Optional - defaults are already set)
VITE_PHONEPE_MERCHANT_ID=TEST-M2342E2P0D51P_25061
VITE_PHONEPE_SALT_KEY=ZWE1NTZiYWEtZGIwYS00YjQ1LTk4MmUtMDY5ZjM3N2Y3NGJh
VITE_PHONEPE_SALT_INDEX=1

# Application Configuration
VITE_DEFAULT_PAYMENT_GATEWAY=phonepe

# Your existing Supabase config
VITE_PUBLIC_SUPABASE_URL=your_supabase_url
VITE_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note:** The test credentials are already hardcoded as defaults in the environment config, so you don't need to add them to `.env` unless you want to override them.

## Test URLs for Local Development

### Local Development URLs
- **Application**: `http://localhost:5173`
- **Create Order**: `http://localhost:5173/api/phonepe/create-order`
- **Verify Payment**: `http://localhost:5173/api/phonepe/verify-payment`
- **Webhook**: `http://localhost:5173/api/phonepe/webhook`

### Public Webhook URL for Testing

Since PhonePe needs to send webhooks to a public URL, you'll need to expose your local server:

#### Option 1: ngrok (Recommended)
```bash
# Install ngrok
npm install -g ngrok

# Start your dev server
npm run dev

# In another terminal, expose your local server
ngrok http 5173
```

Use the generated HTTPS URL (e.g., `https://abc123.ngrok.io`) for webhook configuration.

#### Option 2: VS Code Port Forwarding
1. Open VS Code
2. Go to Ports tab
3. Forward port 5173
4. Make it public
5. Use the generated URL

## Testing Steps

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Payment Flow
1. Navigate to your payment page
2. Select PhonePe as payment gateway
3. Click "Pay" - this should redirect to PhonePe test environment
4. Use PhonePe test payment methods (they provide test UPI IDs, cards, etc.)

### 3. Test Webhook Reception
```bash
# In a new terminal, expose your local server
ngrok http 5173

# Copy the HTTPS URL and configure it in PhonePe dashboard as:
# https://your-ngrok-url.ngrok.io/api/phonepe/webhook
```

## Test Payment Methods

PhonePe sandbox provides these test payment methods:

### Test UPI IDs
- **Success**: `success@ybl`
- **Failure**: `failure@ybl`
- **Pending**: `pending@ybl`

### Test Cards
- **Success Card**: 4111 1111 1111 1111 (CVV: 123, Any future date)
- **Failure Card**: 4000 0000 0000 0002

### Test Mobile Numbers
- **Success**: +91 9999999999
- **Failure**: +91 8888888888

## Verification Commands

### Check Configuration
```javascript
// In browser console, check if PhonePe is properly configured
console.log('PhonePe Config:', {
  merchantId: 'TEST-M2342E2P0D51P_25061',
  environment: 'sandbox'
});
```

### Test API Endpoints

#### Test Create Order
```bash
curl -X POST http://localhost:5173/api/phonepe/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "test-booking-123",
    "amount": 1,
    "currency": "INR",
    "mobileNumber": "9999999999"
  }'
```

#### Test Payment Verification
```bash
curl -X POST http://localhost:5173/api/phonepe/verify-payment \
  -H "Content-Type: application/json" \
  -d '{
    "merchantTransactionId": "TXN_test_123"
  }'
```

## Expected Test Flow

1. **Create Payment Order**
   - POST to `/api/phonepe/create-order`
   - Should return success with redirectUrl

2. **User Redirect**
   - Redirect to PhonePe sandbox payment page
   - User completes payment with test credentials

3. **Return to App**
   - PhonePe redirects back to `/payment-success`
   - App verifies payment status

4. **Webhook Reception**
   - PhonePe sends webhook to your public URL
   - Webhook validates signature and updates payment status

## Monitoring and Debugging

### Console Logs to Watch
```javascript
// These logs should appear during testing:
'PhonePe API Service initialized: { merchantId: "TEST-M2342E2P0D51P_25061", ... }'
'PhonePe webhook received: { merchantTransactionId: "...", state: "COMPLETED" }'
'Payment updated successfully: { paymentId: "...", status: "success" }'
```

### Common Test Issues

1. **Webhook Not Received**
   - Ensure ngrok is running and URL is public
   - Check PhonePe dashboard webhook configuration
   - Verify firewall/antivirus isn't blocking

2. **Payment Stuck in Pending**
   - Check PhonePe test environment status
   - Verify test credentials are correct
   - Try different test payment methods

3. **Signature Validation Failed**
   - Verify salt key is exactly: `ZWE1NTZiYWEtZGIwYS00YjQ1LTk4MmUtMDY5ZjM3N2Y3NGJh`
   - Check salt index is `1`
   - Ensure no extra spaces in configuration

## Next Steps for Production

Once testing is complete:

1. **Get Production Credentials**
   - Register for PhonePe production account
   - Get production Merchant ID and Salt Key

2. **Update Environment Variables**
   ```env
   VITE_PHONEPE_MERCHANT_ID=your_production_merchant_id
   VITE_PHONEPE_SALT_KEY=your_production_salt_key
   ```

3. **Deploy to Production**
   - Set environment to `production`
   - Configure production webhook URLs
   - Test with real payment amounts

## Test Cases

### Test Case 1: Successful Payment Flow
**Objective:** Verify complete successful payment flow from order creation to booking confirmation

**Pre-conditions:**
- PhonePe test environment is configured
- Application is running on `http://localhost:5173`
- ngrok is running for webhook testing

**Test Steps:**
1. Navigate to `http://localhost:5173/customer/payment`
2. Select "PhonePe (UPI)" payment method
3. Enter mobile number: `9999999999`
4. Click "Pay ₹149.99 with PhonePe"
5. Verify redirect to PhonePe sandbox
6. Enter UPI ID: `success@ybl`
7. Complete payment on PhonePe sandbox
8. Verify return to application

**Expected Results:**
- ✅ Payment order created successfully
- ✅ Redirected to PhonePe sandbox environment
- ✅ Payment completed successfully
- ✅ Returned to booking success page
- ✅ Webhook received and processed
- ✅ Booking created in database
- ✅ Payment status updated to "success"

**Console Logs to Check:**
```javascript
"PhonePe payment order created: { success: true, redirectUrl: '...' }"
"PhonePe webhook received: { state: 'COMPLETED' }"
"Payment updated successfully: { status: 'success' }"
```

---

### Test Case 2: Failed Payment Flow
**Objective:** Verify proper handling of failed payments

**Test Steps:**
1. Navigate to payment page
2. Select PhonePe payment method
3. Click "Pay ₹149.99 with PhonePe"
4. On PhonePe sandbox, enter UPI ID: `failure@ybl`
5. Complete the failed payment flow

**Expected Results:**
- ✅ Payment order created successfully
- ✅ Redirected to PhonePe sandbox
- ✅ Payment fails as expected
- ✅ Returned to application with failure status
- ✅ Error message displayed to user
- ✅ Payment status updated to "failed"
- ✅ No booking created for failed payment

---

### Test Case 3: Pending Payment Flow
**Objective:** Test handling of pending payment status

**Test Steps:**
1. Follow steps 1-3 from Test Case 1
2. On PhonePe sandbox, enter UPI ID: `pending@ybl`
3. Observe payment status

**Expected Results:**
- ✅ Payment remains in pending state
- ✅ User can retry payment
- ✅ Payment status shows as "pending"

---

### Test Case 4: API Endpoint Testing
**Objective:** Verify individual API endpoints work correctly

#### 4a. Test Create Order API
```bash
curl -X POST http://localhost:5173/api/phonepe/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "test-booking-123",
    "amount": 1,
    "currency": "INR",
    "mobileNumber": "9999999999"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "orderId": "payment_456",
  "redirectUrl": "https://api-preprod.phonepe.com/...",
  "merchantTransactionId": "TXN_..."
}
```

#### 4b. Test Payment Verification API
```bash
curl -X POST http://localhost:5173/api/phonepe/verify-payment \
  -H "Content-Type: application/json" \
  -d '{
    "merchantTransactionId": "TXN_test_123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "status": "COMPLETED",
  "transactionId": "phonepe_txn_id",
  "amount": 1,
  "paymentMethod": "phonepe"
}
```

---

### Test Case 5: Webhook Validation
**Objective:** Verify webhook signature validation and processing

**Pre-conditions:**
- ngrok is running and webhook URL is configured in PhonePe dashboard

**Test Steps:**
1. Complete a successful payment (Test Case 1)
2. Monitor webhook endpoint logs
3. Verify webhook signature validation

**Expected Results:**
- ✅ Webhook received at `/api/phonepe/webhook`
- ✅ Signature validation passes
- ✅ Payment status updated in database
- ✅ Booking confirmation sent

**Webhook Payload Example:**
```json
{
  "response": "base64_encoded_response",
  "merchantId": "TEST-M2342E2P0D51P_25061",
  "merchantTransactionId": "TXN_...",
  "transactionId": "phonepe_txn_id",
  "amount": 14999,
  "state": "COMPLETED"
}
```

---

### Test Case 6: Invalid Signature Handling
**Objective:** Test security by verifying invalid webhook signatures are rejected

**Test Steps:**
1. Send a webhook with invalid signature to `/api/phonepe/webhook`
2. Monitor response

**Expected Results:**
- ❌ Webhook rejected with 401 status
- ❌ Payment status not updated
- ✅ Security log generated

---

### Test Case 7: Error Handling
**Objective:** Test various error scenarios

#### 7a. Network Failure
**Test Steps:**
1. Disconnect internet during payment creation
2. Attempt to create payment order

**Expected Results:**
- ✅ Proper error message displayed
- ✅ User can retry
- ✅ No incomplete records created

#### 7b. Invalid Booking ID
**Test Steps:**
1. Try to create payment with non-existent booking ID

**Expected Results:**
- ✅ 404 error returned
- ✅ Clear error message displayed

#### 7c. Invalid Amount
**Test Steps:**
1. Try to create payment with amount = 0 or negative

**Expected Results:**
- ✅ Validation error displayed
- ✅ Payment not created

---

### Test Case 8: Mobile Number Validation
**Objective:** Test mobile number field validation

**Test Data:**
- Valid: `9999999999`
- Invalid: `abc123`, `12345`, `99999999999` (11 digits)

**Test Steps:**
1. Enter various mobile numbers
2. Attempt to create payment

**Expected Results:**
- ✅ Valid numbers accepted
- ✅ Invalid numbers rejected with proper validation
- ✅ Optional field works when empty

---

### Test Case 9: Payment Gateway Selection
**Objective:** Verify multiple payment gateway support

**Test Steps:**
1. Navigate to payment page
2. Switch between PhonePe, Card, and PayPal options
3. Verify UI changes appropriately

**Expected Results:**
- ✅ PhonePe shows mobile number field and test info
- ✅ Card shows card input fields
- ✅ PayPal shows PayPal redirect info
- ✅ Payment button text updates correctly

---

### Test Case 10: Environment Configuration
**Objective:** Verify correct environment detection

**Test Steps:**
1. Check console logs for PhonePe configuration
2. Verify API URLs are correct for test environment

**Expected Logs:**
```javascript
"PhonePe API Service initialized: {
  merchantId: 'TEST-M2342E2P0D51P_25061',
  environment: 'development',
  apiUrl: 'https://api-preprod.phonepe.com/apis/pg-sandbox'
}"
```

---

### Test Case 11: Local Storage Handling
**Objective:** Test payment data persistence and cleanup

**Test Steps:**
1. Start payment process
2. Check localStorage for `pendingPayment`
3. Complete payment
4. Verify localStorage cleanup

**Expected Results:**
- ✅ Payment data stored before redirect
- ✅ Data retrieved after return
- ✅ Data cleaned up after completion

---

### Test Case 12: Booking Integration
**Objective:** Verify payment integrates correctly with booking system

**Test Steps:**
1. Complete successful payment
2. Check database for created bookings
3. Verify booking IDs are linked to payment

**Expected Results:**
- ✅ Bookings created for all selected days
- ✅ Booking IDs stored with payment
- ✅ User data properly linked
- ✅ Time slots correctly assigned

---

## Test Checklist

Before moving to production, ensure all test cases pass:

### Core Functionality
- [ ] Test Case 1: Successful Payment Flow
- [ ] Test Case 2: Failed Payment Flow
- [ ] Test Case 3: Pending Payment Flow
- [ ] Test Case 12: Booking Integration

### API Testing
- [ ] Test Case 4: API Endpoint Testing
- [ ] Test Case 5: Webhook Validation
- [ ] Test Case 6: Invalid Signature Handling

### Error Handling
- [ ] Test Case 7: Error Handling (all sub-cases)
- [ ] Test Case 8: Mobile Number Validation

### UI/UX Testing
- [ ] Test Case 9: Payment Gateway Selection
- [ ] Test Case 11: Local Storage Handling

### Configuration
- [ ] Test Case 10: Environment Configuration

### Performance Testing
- [ ] Payment creation under 3 seconds
- [ ] Webhook processing under 1 second
- [ ] Page load times acceptable

### Security Testing
- [ ] Signature validation working
- [ ] No sensitive data in logs
- [ ] HTTPS enforced for webhooks

## Support

- **PhonePe Test Environment**: Available 24/7
- **Documentation**: [PhonePe Developer Portal](https://developer.phonepe.com/)
- **Test Credentials**: Valid until your production approval

Your test environment is ready! Start with small amounts (₹1) and test all payment flows before moving to production. 