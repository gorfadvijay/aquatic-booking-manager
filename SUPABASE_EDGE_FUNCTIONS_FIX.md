# 🚨 URGENT FIX: Supabase Edge Functions Environment Variables

## **🔍 PROBLEM IDENTIFIED**
- ✅ PhonePe payment gateway working
- ❌ Edge functions returning 401 "Missing authorization header"
- ❌ No entries in payments table
- ❌ No entries in bookings table  
- ❌ No redirect to BookingSuccess page

**ROOT CAUSE**: Edge functions missing Supabase environment variables

---

## **🔧 STEP-BY-STEP FIX**

### **Step 1: Get Your Supabase Credentials**

1. Go to https://supabase.com/dashboard
2. Select your project: `sbpswmrjgieicdxnjnhc`
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL**: `https://sbpswmrjgieicdxnjnhc.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...` (starts with eyJ)
   - **service_role key**: `eyJhbGciOiJIUzI1NiIs...` (different key, more permissions)

### **Step 2: Set Environment Variables in Supabase Edge Functions**

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to https://supabase.com/dashboard/project/sbpswmrjgieicdxnjnhc
2. Navigate to **Edge Functions** in the sidebar
3. Click on **Settings** or **Environment Variables**
4. Add these environment variables:

```bash
SUPABASE_URL=https://sbpswmrjgieicdxnjnhc.supabase.co
SUPABASE_ANON_KEY=your_anon_public_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Option B: Via Supabase CLI (Alternative)**

If you have Supabase CLI installed:

```bash
# Set environment variables for all functions
supabase secrets set SUPABASE_URL=https://sbpswmrjgieicdxnjnhc.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your_anon_public_key_here
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### **Step 3: Redeploy All Edge Functions**

After setting environment variables, redeploy all functions:

1. **create-payment-order**
2. **verify-payment**
3. **check-order-status**
4. **payment-webhook**

**Via Supabase Dashboard:**
1. Go to Edge Functions
2. Select each function
3. Click "Deploy" or "Redeploy"

---

## **🧪 VERIFICATION STEPS**

### **Test 1: Create Payment Order**
```bash
# This should now work without 401 error
curl -X POST https://sbpswmrjgieicdxnjnhc.supabase.co/functions/v1/create-payment-order \
  -H "Content-Type: application/json" \
  -d '{
    "merchantOrderId": "OM123456789",
    "amount": 149.99,
    "userDetails": {
      "id": "test-user",
      "name": "Test User", 
      "email": "test@example.com",
      "phone": "9876543210"
    },
    "bookingMetadata": {
      "daysInfo": [{"date": "2024-12-25", "slot": {"id": "slot-123"}}],
      "startTime": "09:00",
      "endTime": "10:00",
      "userDetails": {"name": "Test User", "email": "test@example.com", "phone": "9876543210"}
    }
  }'
```

**Expected Result**: Success response with payment URL (not 401 error)

### **Test 2: Check Database Entries**
1. Go to Supabase Dashboard → Table Editor
2. Check **payments** table → Should have new entries
3. Check **bookings** table → Should have entries after payment verification

### **Test 3: Complete Payment Flow**
1. Go through your frontend payment flow
2. Complete payment with UPI test credentials
3. Should redirect to BookingSuccess page
4. Should see entries in both tables

---

## **🎯 EXPECTED RESULTS AFTER FIX**

### **✅ What Should Work:**
1. **Payment Order Creation**: Creates entry in `payments` table
2. **PhonePe Redirect**: Still works (already working)
3. **Payment Verification**: Finds payment record, creates bookings  
4. **Database Entries**: 
   - `payments` table: Payment record with metadata
   - `bookings` table: Booking records for each day
5. **Frontend Redirect**: Redirects to BookingSuccess page
6. **User Experience**: Complete end-to-end flow works

### **📊 Database Schema Check:**
- **payments** table should have: `transaction_id`, `amount`, `status`, `booking_metadata`
- **bookings** table should have: `user_id`, `slot_id`, `booking_date`, `start_time`, `end_time`, `status`

---

## **🆘 TROUBLESHOOTING**

### **If Still Getting 401 Errors:**
1. Double-check environment variable names (exact spelling)
2. Ensure keys are copied completely (they're very long)
3. Redeploy functions after setting variables
4. Check Supabase project permissions

### **If Payment Records Not Created:**
1. Check edge function logs in Supabase Dashboard
2. Verify database table permissions
3. Check if service_role key has database access

### **If Bookings Not Created:**
1. Check if payment verification is successful
2. Verify booking metadata format
3. Check users table exists and has proper permissions

---

## **📋 VERIFICATION CHECKLIST**

- [ ] Environment variables set in Supabase Edge Functions
- [ ] All 4 edge functions redeployed
- [ ] Test payment order creation (no 401 error)
- [ ] Payment record appears in database
- [ ] Complete payment flow test
- [ ] Bookings created after payment verification
- [ ] Redirect to BookingSuccess page works

**After completing these steps, your payment flow will work end-to-end with database entries and proper redirects!** 🚀 