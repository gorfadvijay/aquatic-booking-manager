# 🚀 FINAL DEPLOYMENT INSTRUCTIONS

## Current Status: Edge Functions NOT Deployed (401 Errors)

You need to deploy 2 edge functions to Supabase with the exact code below.

---

## 🎯 STEP 1: Deploy create-payment-order Function

1. **Go to**: https://supabase.com/dashboard/project/sbpswmrjgieicdxnjnhc/functions

2. **Create/Edit Function**: `create-payment-order`

3. **Copy this EXACT code**:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// PhonePe Configuration - Using WORKING UAT credentials
const PHONEPE_CONFIG = {
  merchantId: 'PGTESTPAYUAT86',
  saltKey: '96434309-7796-489d-8924-ab56988a6076',
  saltIndex: '1',
  baseUrl: 'https://api-preprod.phonepe.com/apis/pg-sandbox'
};

const generateChecksum = async (payload: string, endpoint: string, saltKey: string, saltIndex: string): Promise<string> => {
  const stringToHash = payload + endpoint + saltKey;
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hash}###${saltIndex}`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== PhonePe Payment Order Creation ===');

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData = await req.json();
    let { merchantOrderId, amount, userDetails, bookingMetadata } = requestData;
    
    if (!merchantOrderId) {
      const timestamp = Date.now().toString();
      const random = Math.random().toString().slice(2, 8);
      merchantOrderId = `OM${timestamp}${random}`;
    }
    
    if (!amount || !userDetails) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required fields: amount, userDetails' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const frontendUrl = 'http://localhost:8080';

    // Initialize Supabase with hardcoded credentials
    const supabaseUrl = 'https://sbpswmrjgieicdxnjnhc.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5Mjc5MDEsImV4cCI6MjA1MDUwMzkwMX0.H_KwdQm8VIGpxOGBOFNYlw8TGG3_3r-8xPK2B3SWBH4';
    
    console.log('Using Supabase URL:', supabaseUrl);
    console.log('Using hardcoded credentials for database access');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store payment record
    try {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          transaction_id: merchantOrderId,
          booking_id: merchantOrderId,
          amount: amount,
          status: 'pending',
          booking_metadata: bookingMetadata || null,
          created_at: new Date().toISOString()
        }]);

      if (paymentError) {
        console.error('Error storing payment record:', paymentError);
      } else {
        console.log('✅ Payment record stored successfully');
      }
    } catch (error) {
      console.error('Error in payment storage:', error);
    }

    // Create PhonePe payload
    const paymentPayload = {
      merchantId: PHONEPE_CONFIG.merchantId,
      merchantTransactionId: merchantOrderId,
      merchantUserId: userDetails.id || `USER_${Date.now()}`,
      amount: Math.round(amount * 100),
      redirectUrl: `${frontendUrl}/customer/payment?merchantOrderId=${merchantOrderId}`,
      redirectMode: 'POST',
      callbackUrl: `${frontendUrl}/customer/payment?merchantOrderId=${merchantOrderId}`,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    const payloadString = JSON.stringify(paymentPayload);
    const base64Payload = btoa(payloadString);
    
    const endpoint = '/pg/v1/pay';
    const checksum = await generateChecksum(base64Payload, endpoint, PHONEPE_CONFIG.saltKey, PHONEPE_CONFIG.saltIndex);
    
    const requestUrl = `${PHONEPE_CONFIG.baseUrl}${endpoint}`;
    const requestHeaders = {
      'Content-Type': 'application/json',
      'X-VERIFY': checksum,
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0'
    };
    
    const requestBody = JSON.stringify({ request: base64Payload });
    
    try {
      const phonePeResponse = await fetch(requestUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: requestBody
      });

      const responseText = await phonePeResponse.text();
      let phonePeResult;
      
      try {
        phonePeResult = JSON.parse(responseText);
      } catch (parseError) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Invalid response from PhonePe API'
          }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (phonePeResult.success && phonePeResult.data && phonePeResult.data.instrumentResponse) {
        console.log('✅ Payment order created successfully');
        return new Response(
          JSON.stringify({
            success: true,
            orderId: phonePeResult.data.merchantTransactionId || merchantOrderId,
            paymentUrl: phonePeResult.data.instrumentResponse.redirectInfo?.url,
            merchantOrderId: merchantOrderId,
            state: 'CREATED',
            message: 'Payment order created successfully'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: phonePeResult.message || 'Payment order creation failed'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } catch (networkError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Network error: ${networkError.message}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

4. **Click "Deploy Function"**

---

## 🎯 STEP 2: Deploy verify-payment Function

1. **Create/Edit Function**: `verify-payment`

2. **Copy this EXACT code**:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PHONEPE_CONFIG = {
  merchantId: 'PGTESTPAYUAT86',
  saltKey: '96434309-7796-489d-8924-ab56988a6076',
  saltIndex: '1',
  baseUrl: 'https://api-preprod.phonepe.com/apis/pg-sandbox'
};

const generateChecksum = async (endpoint: string, saltKey: string, saltIndex: string): Promise<string> => {
  const stringToHash = endpoint + saltKey;
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hash}###${saltIndex}`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { merchantOrderId } = await req.json();
    
    if (!merchantOrderId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing merchantOrderId' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying payment for:', merchantOrderId);

    // Initialize Supabase with hardcoded credentials
    const supabaseUrl = 'https://sbpswmrjgieicdxnjnhc.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5Mjc5MDEsImV4cCI6MjA1MDUwMzkwMX0.H_KwdQm8VIGpxOGBOFNYlw8TGG3_3r-8xPK2B3SWBH4';
    
    console.log('Using hardcoded credentials for database access');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get payment record
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', merchantOrderId)
      .single();

    if (paymentError || !paymentData) {
      console.error('Payment record not found:', paymentError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Payment record not found',
          state: 'NOT_FOUND'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check payment status with PhonePe
    const endpoint = `/pg/v1/status/${PHONEPE_CONFIG.merchantId}/${merchantOrderId}`;
    const checksum = await generateChecksum(endpoint, PHONEPE_CONFIG.saltKey, PHONEPE_CONFIG.saltIndex);
    
    try {
      const statusResponse = await fetch(`${PHONEPE_CONFIG.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': PHONEPE_CONFIG.merchantId,
          'Accept': 'application/json'
        }
      });

      const statusText = await statusResponse.text();
      let statusResult;
      
      try {
        statusResult = JSON.parse(statusText);
      } catch (parseError) {
        console.error('Failed to parse PhonePe status response');
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Invalid status response from PhonePe'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (statusResult.success && statusResult.data && statusResult.data.state === 'COMPLETED') {
        console.log('✅ Payment verified successfully');
        
        // Update payment status
        await supabase
          .from('payments')
          .update({ status: 'completed' })
          .eq('transaction_id', merchantOrderId);

        // Create bookings if metadata exists
        const bookingIds = [];
        if (paymentData.booking_metadata && paymentData.booking_metadata.daysInfo) {
          for (const dayInfo of paymentData.booking_metadata.daysInfo) {
            try {
              const { data: bookingData, error: bookingError } = await supabase
                .from('bookings')
                .insert([{
                  user_id: paymentData.booking_metadata.userId || 'guest',
                  slot_id: dayInfo.slot?.id || 'unknown',
                  booking_date: dayInfo.date,
                  start_time: paymentData.booking_metadata.startTime || '09:00',
                  end_time: paymentData.booking_metadata.endTime || '10:00',
                  status: 'confirmed',
                  customer_name: paymentData.booking_metadata.userDetails?.name || 'Guest',
                  customer_email: paymentData.booking_metadata.userDetails?.email || 'guest@example.com',
                  created_at: new Date().toISOString()
                }])
                .select();

              if (bookingData && bookingData[0]) {
                bookingIds.push(bookingData[0].id);
              }
            } catch (bookingError) {
              console.error('Error creating booking:', bookingError);
            }
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            state: 'COMPLETED',
            transactionId: merchantOrderId,
            bookingIds: bookingIds,
            message: 'Payment verified and bookings created successfully'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            state: statusResult.data?.state || 'UNKNOWN',
            error: 'Payment verification failed'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } catch (networkError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `PhonePe status check failed: ${networkError.message}`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

3. **Click "Deploy Function"**

---

## 🎯 STEP 3: Wait and Test

1. **Wait 2-3 minutes** for deployment to complete

2. **Run test**:
```bash
node test-final-deployment.js
```

3. **Expected Result**: All ✅ instead of 401 errors

---

## 🎯 STEP 4: Test Complete Flow

1. Go to your app: `http://localhost:8080/customer/payment`
2. Complete payment with PhonePe
3. Should redirect to `/customer/booking-success`
4. Check Supabase tables for entries

## 🎉 SUCCESS INDICATORS

- ✅ Payment order creates database entry
- ✅ PhonePe payment works  
- ✅ Payment verification finds record
- ✅ Bookings created in database
- ✅ Redirect to BookingSuccess page
- ✅ Complete end-to-end flow working

Deploy these functions now and test! 🚀 