# 🚨 URGENT: Deploy Edge Functions to Fix Payment Flow

## **CURRENT PROBLEM**
- ❌ Edge functions returning 401 "Missing authorization header"
- ❌ No database entries being created
- ❌ Payment verification failing continuously
- ❌ Frontend stuck in verification loop

## **SOLUTION: Deploy Updated Edge Functions**

### **🎯 STEP 1: Deploy create-payment-order Function**

1. Go to: https://supabase.com/dashboard/project/sbpswmrjgieicdxnjnhc/functions
2. Create/Update `create-payment-order` function with this EXACT code:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// PhonePe Configuration - Using WORKING UAT credentials (tested and verified)
const PHONEPE_CONFIG = {
  merchantId: 'PGTESTPAYUAT86',
  saltKey: '96434309-7796-489d-8924-ab56988a6076',
  saltIndex: '1',
  baseUrl: 'https://api-preprod.phonepe.com/apis/pg-sandbox'
};

// Generate checksum exactly as per PhonePe specification
const generateChecksum = async (payload: string, endpoint: string, saltKey: string, saltIndex: string): Promise<string> => {
  const stringToHash = payload + endpoint + saltKey;
  console.log('Generating checksum for:', { payloadLength: payload.length, endpoint });
  
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const checksum = `${hash}###${saltIndex}`;
  
  return checksum;
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

    // Parse request
    const requestData = await req.json();
    console.log('Received request data:', { 
      hasAmount: !!requestData.amount, 
      hasUserDetails: !!requestData.userDetails 
    });

    // Validate required fields
    let { merchantOrderId, amount, userDetails, bookingMetadata } = requestData;
    
    if (!merchantOrderId) {
      // Generate transaction ID in PhonePe format (OM + timestamp + random digits)
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

    const frontendUrl = 'http://localhost:8080'; // Fixed URL for your development environment

    // Initialize Supabase - Try environment variables first, fallback to hardcoded
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://sbpswmrjgieicdxnjnhc.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 
                       Deno.env.get('SUPABASE_ANON_KEY') ?? 
                       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5Mjc5MDEsImV4cCI6MjA1MDUwMzkwMX0.H_KwdQm8VIGpxOGBOFNYlw8TGG3_3r-8xPK2B3SWBH4';
    
    console.log('Using Supabase URL:', supabaseUrl);
    console.log('Using Supabase Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');
    
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

    // Create PhonePe payload - CORRECTED FORMAT
    const paymentPayload = {
      merchantId: PHONEPE_CONFIG.merchantId,
      merchantTransactionId: merchantOrderId,
      merchantUserId: userDetails.id || `USER_${Date.now()}`,
      amount: Math.round(amount * 100), // Amount in paise
      redirectUrl: `${frontendUrl}/customer/payment?merchantOrderId=${merchantOrderId}`,
      redirectMode: 'POST',
      callbackUrl: `${frontendUrl}/customer/payment?merchantOrderId=${merchantOrderId}`,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    console.log('Payment payload:', JSON.stringify(paymentPayload, null, 2));

    // Convert to base64
    const payloadString = JSON.stringify(paymentPayload);
    const base64Payload = btoa(payloadString);
    
    console.log('Base64 payload created, length:', base64Payload.length);
    
    // Generate checksum
    const endpoint = '/pg/v1/pay';
    const checksum = await generateChecksum(base64Payload, endpoint, PHONEPE_CONFIG.saltKey, PHONEPE_CONFIG.saltIndex);
    
    console.log('Checksum generated');
    
    // Make API call to PhonePe
    const requestUrl = `${PHONEPE_CONFIG.baseUrl}${endpoint}`;
    const requestHeaders = {
      'Content-Type': 'application/json',
      'X-VERIFY': checksum,
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0'
    };
    
    const requestBody = JSON.stringify({ request: base64Payload });
    
    console.log('Making request to:', requestUrl);
    console.log('Request headers:', requestHeaders);
    
    try {
      const phonePeResponse = await fetch(requestUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: requestBody
      });

      console.log('PhonePe response status:', phonePeResponse.status);
      
      const responseText = await phonePeResponse.text();
      console.log('PhonePe raw response:', responseText);
      
      let phonePeResult;
      try {
        phonePeResult = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse PhonePe response');
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Invalid response from PhonePe API',
            details: { status: phonePeResponse.status, response: responseText }
          }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Parsed PhonePe response:', phonePeResult);
      
      if (phonePeResult.success && phonePeResult.data && phonePeResult.data.instrumentResponse) {
        console.log('✅ Payment order created successfully');
        return new Response(
          JSON.stringify({
            success: true,
            orderId: phonePeResult.data.merchantTransactionId || merchantOrderId,
            paymentUrl: phonePeResult.data.instrumentResponse.redirectInfo?.url,
            merchantOrderId: merchantOrderId,
            state: 'CREATED',
            message: 'Payment order created successfully',
            phonePeTransactionId: phonePeResult.data.transactionId
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.error('❌ PhonePe API Error:', phonePeResult);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: phonePeResult.message || 'Payment order creation failed',
            code: phonePeResult.code || 'UNKNOWN_ERROR',
            details: phonePeResult 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } catch (networkError) {
      console.error('❌ Network error:', networkError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Network error: ${networkError.message}`,
          code: 'NETWORK_ERROR'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Payment order creation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### **🎯 STEP 2: Deploy verify-payment Function**

Create/Update `verify-payment` function with the code from `supabase/functions/verify-payment/index.ts`

### **🎯 STEP 3: Test Deployment**

After deploying both functions, run:
```bash
node test-deployment.js
```

**Expected Result**: Status 200 (not 401) + Success response

### **🎯 STEP 4: Test Complete Flow**

1. Go to: http://localhost:8080/customer/payment
2. Complete payment
3. Should redirect to BookingSuccess page
4. Check Supabase tables for database entries

## **VERIFICATION CHECKLIST**

- [ ] create-payment-order function deployed with above code
- [ ] verify-payment function deployed 
- [ ] test-deployment.js shows Status 200
- [ ] Complete payment flow works
- [ ] Database entries created in payments and bookings tables

**Deploy these functions now to fix the payment flow!** 🚀 