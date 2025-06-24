# 🚀 DEPLOY EDGE FUNCTIONS - FINAL FIX

## 🎯 YOU NEED TO DEPLOY 2 FUNCTIONS TO SUPABASE

Current Status: **401 Errors** - Functions not deployed

## STEP 1: Go to Supabase Dashboard
**URL**: https://supabase.com/dashboard/project/sbpswmrjgieicdxnjnhc/functions

## STEP 2: Deploy create-payment-order Function

1. Click "New Function" or edit existing
2. Name: `create-payment-order`
3. Copy the code from: `supabase/functions/create-payment-order/index.ts`
4. Make sure it includes this hardcoded credentials section:

```typescript
// Initialize Supabase with hardcoded credentials
const supabaseUrl = 'https://sbpswmrjgieicdxnjnhc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5Mjc5MDEsImV4cCI6MjA1MDUwMzkwMX0.H_KwdQm8VIGpxOGBOFNYlw8TGG3_3r-8xPK2B3SWBH4';

const supabase = createClient(supabaseUrl, supabaseKey);
```

5. Click "Deploy Function"

## STEP 3: Deploy verify-payment Function

1. Click "New Function" or edit existing  
2. Name: `verify-payment`
3. Copy the code from: `supabase/functions/verify-payment/index.ts`
4. Make sure it includes the same hardcoded credentials
5. Click "Deploy Function"

## STEP 4: Test Deployment

Wait 2-3 minutes, then run:
```bash
node test-final-deployment.js
```

**Expected**: Status 200 (not 401)

## STEP 5: Test Your App

1. Go to payment page
2. Complete PhonePe payment  
3. Should redirect to booking-success
4. Check database for entries

## 🔄 After Deployment

The complete flow will work:
- ✅ Payment creates database entry
- ✅ PhonePe payment succeeds
- ✅ Verification finds payment record
- ✅ Bookings created automatically
- ✅ Redirects to success page

**Deploy the functions now!** 🚀 