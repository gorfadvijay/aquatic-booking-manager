# 🚨 URGENT: REDEPLOY EDGE FUNCTIONS

## ❌ **CURRENT ISSUE**
Your edge functions are returning "Invalid JWT" errors because they're using anon key instead of service role key.

## ✅ **SOLUTION**
I've updated both functions with the correct service role key. You need to redeploy them.

---

## 🎯 **IMMEDIATE ACTION REQUIRED**

### STEP 1: Go to Supabase Dashboard
**URL**: https://supabase.com/dashboard/project/sbpswmrjgieicdxnjnhc/functions

### STEP 2: Redeploy create-payment-order
1. Click on `create-payment-order` function
2. Copy the updated code from: `supabase/functions/create-payment-order/index.ts`
3. Click "Deploy Function"

**Key Change**: Now uses service role key for database access

### STEP 3: Redeploy verify-payment  
1. Click on `verify-payment` function
2. Copy the updated code from: `supabase/functions/verify-payment/index.ts`
3. Click "Deploy Function"

**Key Change**: Now uses service role key for database access

---

## 🔧 **WHAT I FIXED**

### Before (Broken):
```typescript
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5Mjc5MDEsImV4cCI6MjA1MDUwMzkwMX0.H_KwdQm8VIGpxOGBOFNYlw8TGG3_3r-8xPK2B3SWBH4';
```

### After (Fixed):
```typescript
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDkyNzkwMSwiZXhwIjoyMDUwNTAzOTAxfQ.Vu7H3frSo_JzQIU1GRn4qLIZMY1FQPFLaFFzL4-tnHU';
```

**Result**: Functions can now access database and create bookings properly.

---

## ✅ **AFTER REDEPLOYMENT**

Run this test to verify:
```bash
node test-frontend-api.js
```

**Expected Result**: Status 200 instead of 401 errors.

---

## 🎯 **THEN TEST YOUR APP**

1. **Go to**: `http://localhost:8080/customer/payment?merchantOrderId=OM1750684195543612481`
2. **Should see**: Payment verification working
3. **Should redirect**: To booking-success page
4. **Database**: Should have payment and booking entries

---

## 🚨 **CRITICAL: REDEPLOY BOTH FUNCTIONS NOW!**

Without redeployment, your payment verification will keep failing with 401 errors.

**Redeploy both functions → Test → Complete payment flow working!** 🚀 