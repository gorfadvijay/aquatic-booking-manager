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
    const supabaseUrl = 'https://sbpswmrjgieicdxnjnhc.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDMxMjIsImV4cCI6MjA2Mjc3OTEyMn0.oUA0JCGySdxnR7-i-mhZpHoGsmXlbYqK4q1S_dpGjyM';
    
    console.log('Using Supabase URL:', supabaseUrl);
    console.log('Using Supabase Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store payment record
    try {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          transaction_id: merchantOrderId,
          payment_id: `PAY_${merchantOrderId}`, // Unique payment ID
          booking_id: null, // Set to null initially, will be linked after booking creation
          amount: amount,
          status: 'pending',
          payment_method: 'phonepe',
          booking_metadata: bookingMetadata || null,
          created_at: new Date().toISOString()
        }]);

      if (paymentError) {
        console.error('Error storing payment record:', paymentError);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Failed to store payment record',
            details: paymentError.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log('✅ Payment record stored successfully');
      }
    } catch (error) {
      console.error('Error in payment storage:', error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to store payment record',
          details: error.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create PhonePe payload - CORRECTED FORMAT
      const paymentPayload = {
      merchantId: PHONEPE_CONFIG.merchantId,
      merchantTransactionId: merchantOrderId,
      merchantUserId: userDetails.id || `USER_${Date.now()}`,
      amount: Math.round(amount * 100), // Amount in paise
      redirectUrl: `${frontendUrl}/customer/payment?merchantOrderId=${merchantOrderId}`,
      redirectMode: 'REDIRECT',
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