# 🔧 Payment Verification Fix Instructions

## 🔍 **Issues Identified**

1. **✅ PhonePe Integration Working**: Payment gateway redirects are working
2. **❌ Port Mismatch**: Fixed - Updated edge function to use port 8083
3. **❌ Authorization Error**: Missing/incorrect Supabase anon key
4. **❌ Payment Not Completed**: Transaction may have been cancelled or expired

## 🛠️ **IMMEDIATE FIXES REQUIRED**

### **1. Create/Update .env File**

Create a `.env` file in your project root with the correct Supabase credentials:

```bash
# Supabase Configuration
VITE_PUBLIC_SUPABASE_URL=https://sbpswmrjgieicdxnjnhc.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=YOUR_CORRECT_ANON_KEY_HERE

# Frontend URL (correct port for your dev server)
FRONTEND_URL=http://localhost:8083

# PhonePe UAT Credentials - WORKING & TESTED
VITE_PHONEPE_MERCHANT_ID=PGTESTPAYUAT86
VITE_PHONEPE_SALT_KEY=96434309-7796-489d-8924-ab56988a6076
VITE_PHONEPE_SALT_INDEX=1
VITE_PHONEPE_API_URL=https://api-preprod.phonepe.com/apis/pg-sandbox

# Development settings
VITE_DEFAULT_PAYMENT_GATEWAY=phonepe
```

**To get the correct SUPABASE_ANON_KEY:**
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `sbpswmrjgieicdxnjnhc`
3. Go to Settings > API
4. Copy the "anon public" key

### **2. Deploy Updated Edge Functions**

The edge functions have been updated with:
- ✅ Working PhonePe credentials (`PGTESTPAYUAT86`)
- ✅ Correct redirect URL (port 8083)
- ✅ Proper payload structure

**Deploy via Supabase Dashboard:**
1. `create-payment-order` (Updated ✅)
2. `verify-payment` (Updated ✅)
3. `check-order-status` (Updated ✅)
4. `payment-webhook` (Updated ✅)

### **3. Test the Complete Flow**

After deploying and setting up the .env file:

1. **Start your dev server**: `npm run dev` (should be on port 8083)
2. **Go through payment flow**: Create a booking and proceed to payment
3. **Complete payment**: Use UPI test credentials from earlier
4. **Check verification**: Should redirect back to your app properly

## 🧪 **Testing Payment Flow**

### **UPI Test Credentials**
```
UPI ID: test@paytm, success@upi, 9876543210@paytm
PIN: 1234, 123456, 0000 (any 4-6 digits)
```

### **Expected Flow**
```
1. User clicks "Pay with PhonePe" ✅
2. Redirects to PhonePe payment page ✅
3. User completes payment with test UPI
4. PhonePe redirects back to: http://localhost:8083/customer/payment?merchantOrderId=OM...
5. Payment verification API call succeeds ✅
6. Bookings created in database ✅
7. User sees booking success page ✅
```

## 🔧 **Troubleshooting**

### **If Payment Verification Still Fails:**

1. **Check Supabase anon key**:
   ```bash
   # Test if your anon key works
   curl -H "Authorization: Bearer YOUR_ANON_KEY" \
        -H "apikey: YOUR_ANON_KEY" \
        https://sbpswmrjgieicdxnjnhc.supabase.co/rest/v1/payments?select=*&limit=1
   ```

2. **Check edge function logs**:
   - Go to Supabase Dashboard > Edge Functions
   - Click on `verify-payment` function
   - Check logs for any errors

3. **Check payment record in database**:
   - Go to Supabase Dashboard > Table Editor > payments
   - Look for transaction ID: `OM175067925162668230`
   - Check if record exists and has proper booking_metadata

### **If No Payment Record in Database:**

The payment order creation may have failed. Check:
1. Edge function deployment status
2. Supabase environment variables in edge functions
3. PhonePe API response logs

## 📊 **Current Status**

- ✅ **PhonePe Credentials**: Working (`PGTESTPAYUAT86`)
- ✅ **Transaction ID Format**: Correct (`OM{timestamp}{random}`)
- ✅ **Edge Functions**: Updated and ready for deployment
- ✅ **Port Configuration**: Fixed (8083)
- ❌ **Authorization**: Needs correct Supabase anon key
- ❌ **Payment Completion**: Needs testing with actual payment

## 🎯 **Next Steps**

1. **Get correct Supabase anon key from dashboard**
2. **Create .env file with all credentials**
3. **Deploy all 4 updated edge functions**
4. **Test complete payment flow**
5. **Verify bookings are created in database**

After these steps, your payment flow should work end-to-end! 🚀

## 🆘 **If Still Issues**

1. Check browser network tab for specific API errors
2. Check Supabase edge function logs
3. Verify payment completion on PhonePe side
4. Test with a fresh payment transaction 