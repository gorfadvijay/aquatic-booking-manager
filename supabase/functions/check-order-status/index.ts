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

// Generate checksum for status check
const generateChecksum = async (endpoint: string, saltKey: string, saltIndex: string): Promise<string> => {
  const stringToHash = endpoint + saltKey;
  console.log('Generating status check checksum for endpoint:', endpoint);
  
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
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      'https://sbpswmrjgieicdxnjnhc.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDMxMjIsImV4cCI6MjA2Mjc3OTEyMn0.oUA0JCGySdxnR7-i-mhZpHoGsmXlbYqK4q1S_dpGjyM'
    )

    if (req.method === 'POST') {
      let requestData
      try {
        requestData = await req.json()
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Invalid JSON in request body' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { merchantOrderId } = requestData

      if (!merchantOrderId) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Missing merchantOrderId' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Checking status for order:', merchantOrderId);

      // Generate status check URL and checksum
      const endpoint = `/pg/v1/status/${PHONEPE_CONFIG.merchantId}/${merchantOrderId}`;
      const checksum = await generateChecksum(endpoint, PHONEPE_CONFIG.saltKey, PHONEPE_CONFIG.saltIndex);
      
      const requestUrl = `${PHONEPE_CONFIG.baseUrl}${endpoint}`;
      const requestHeaders = {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': PHONEPE_CONFIG.merchantId,
        'Accept': 'application/json'
      };

      console.log('Making status check request to:', requestUrl);

      try {
        const response = await fetch(requestUrl, {
          method: 'GET',
          headers: requestHeaders
        });

        console.log('Status check response status:', response.status);
        
        const responseText = await response.text();
        console.log('Raw status response:', responseText);

        let result;
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse status response');
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Invalid response from PhonePe status API',
              details: { status: response.status, response: responseText }
            }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Parsed status response:', result);

        // Return the status information
        if (result.success && result.data) {
          const orderState = result.data.state // COMPLETED, FAILED, PENDING
          const amount = result.data.amount / 100 // Convert from paise to rupees
          
          // Update our local payment record
          const { error: updateError } = await supabase
            .from('payments')
            .update({
              status: orderState === 'COMPLETED' ? 'success' : orderState === 'FAILED' ? 'failed' : 'pending',
              payment_id: result.data.transactionId,
              updated_at: new Date().toISOString()
            })
            .eq('transaction_id', merchantOrderId)

          if (updateError) {
            console.error('Error updating payment status:', updateError)
          }

          return new Response(
            JSON.stringify({
              success: true,
              status: orderState,
              transactionId: result.data.transactionId,
              merchantTransactionId: result.data.merchantTransactionId,
              amount: amount,
              responseCode: result.data.responseCode,
              message: result.message || 'Status check successful',
              data: result.data
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              error: result.message || 'Status check failed',
              code: result.code || 'UNKNOWN_ERROR',
              details: result
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } catch (networkError) {
        console.error('Network error during status check:', networkError);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Network error: ${networkError.message}`,
            code: 'NETWORK_ERROR'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Order status check error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 