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
  saltIndex: '1'
};

// Verify webhook signature
const verifyWebhookSignature = async (requestBody: string, xVerifyHeader: string): Promise<boolean> => {
  try {
    const [receivedHash, receivedSaltIndex] = xVerifyHeader.split('###');
    
    if (receivedSaltIndex !== PHONEPE_CONFIG.saltIndex) {
      console.error('Salt index mismatch');
      return false;
    }

    // Calculate expected hash
    const expectedString = requestBody + PHONEPE_CONFIG.saltKey;
    const encoder = new TextEncoder();
    const data = encoder.encode(expectedString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Webhook signature verification:', {
      receivedHash: receivedHash.substring(0, 10) + '...',
      expectedHash: expectedHash.substring(0, 10) + '...',
      match: receivedHash === expectedHash
    });

    return receivedHash === expectedHash;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};

// Create user in Supabase
const createUser = async (supabase: any, userDetails: any) => {
  console.log('Creating/finding user for webhook:', userDetails.email);
  
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', userDetails.email)
    .single();

  if (existingUser) {
    return existingUser;
  }

  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert([{
      email: userDetails.email,
      name: userDetails.name,
      phone: userDetails.phone,
      role: 'customer',
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (createError) {
    console.error('Error creating user in webhook:', createError);
    throw new Error(`Failed to create user: ${createError.message}`);
  }

  return newUser;
};

// Create bookings from webhook
const createBookings = async (supabase: any, bookingMetadata: any, userId: string, paymentId: string) => {
  console.log('Creating bookings from webhook for user:', userId);
  
  if (!bookingMetadata || (!bookingMetadata.selectedDates && !bookingMetadata.daysInfo)) {
    console.warn('No booking metadata found in webhook');
    return [];
  }

  const bookingIds = [];
  
  // Handle both formats
  let daysToProcess = [];
  if (bookingMetadata.selectedDates) {
    daysToProcess = bookingMetadata.selectedDates.map((dateStr: string) => ({
      date: dateStr,
      slotId: bookingMetadata.slotId
    }));
  } else if (bookingMetadata.daysInfo) {
    daysToProcess = bookingMetadata.daysInfo.map((dayInfo: any) => ({
      date: dayInfo.date,
      slotId: dayInfo.slot?.id
    }));
  }
  
  for (const dayInfo of daysToProcess) {
    if (dayInfo.slotId) {
      const bookingData = {
        user_id: userId,
        slot_id: dayInfo.slotId,
        booking_date: dayInfo.date,
        start_time: bookingMetadata.startTime,
        end_time: bookingMetadata.endTime,
        status: 'confirmed',
        payment_id: paymentId,
        created_at: new Date().toISOString()
      };
      
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (!error && booking) {
        bookingIds.push(booking.id);
        console.log('Webhook booking created:', booking.id);
      }
    }
  }

  return bookingIds;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== PhonePe Payment Webhook ===');

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get webhook data
    const requestBody = await req.text();
    const xVerifyHeader = req.headers.get('x-verify') || '';
    
    console.log('Webhook received:', {
      hasBody: !!requestBody,
      hasXVerify: !!xVerifyHeader,
      bodyLength: requestBody.length
    });

    // Verify webhook signature
    if (!await verifyWebhookSignature(requestBody, xVerifyHeader)) {
      console.error('Webhook signature verification failed');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse webhook data
    let webhookData;
    try {
      webhookData = JSON.parse(requestBody);
    } catch (parseError) {
      console.error('Failed to parse webhook data:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid webhook data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Webhook data:', webhookData);

    // Decode the response if it's base64 encoded
    let paymentData;
    if (webhookData.response) {
      try {
        const decodedResponse = atob(webhookData.response);
        paymentData = JSON.parse(decodedResponse);
      } catch (decodeError) {
        console.error('Failed to decode webhook response:', decodeError);
        paymentData = webhookData;
      }
    } else {
      paymentData = webhookData;
    }

    console.log('Decoded payment data:', paymentData);

    // Initialize Supabase
    const supabase = createClient(
      'https://sbpswmrjgieicdxnjnhc.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDMxMjIsImV4cCI6MjA2Mjc3OTEyMn0.oUA0JCGySdxnR7-i-mhZpHoGsmXlbYqK4q1S_dpGjyM'
    )

    // Extract merchant transaction ID
    const merchantTransactionId = paymentData.data?.merchantTransactionId || 
                                  paymentData.merchantTransactionId ||
                                  paymentData.data?.merchantOrderId;

    if (!merchantTransactionId) {
      console.error('No merchant transaction ID found in webhook');
      return new Response(
        JSON.stringify({ error: 'Missing transaction ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing webhook for transaction:', merchantTransactionId);

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', merchantTransactionId)
      .single();

    if (paymentError || !payment) {
      console.error('Payment record not found for webhook:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Payment record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update payment with webhook data
    const paymentState = paymentData.data?.state || paymentData.state || 'UNKNOWN';
    const newStatus = paymentState === 'COMPLETED' ? 'success' : 
                     paymentState === 'FAILED' ? 'failed' : 'pending';

    const { error: updateError } = await supabase
      .from('payments')
      .update({ 
        status: newStatus,
        phonepe_response: paymentData,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Error updating payment from webhook:', updateError);
    }

    // Create bookings if payment is successful and we haven't created them yet
    let bookingIds = [];
    if (paymentState === 'COMPLETED' && payment.booking_metadata) {
      // Check if bookings already exist for this payment
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('payment_id', payment.id);

      if (!existingBookings || existingBookings.length === 0) {
        try {
          const user = await createUser(supabase, payment.booking_metadata.userDetails);
          bookingIds = await createBookings(supabase, payment.booking_metadata, user.id, payment.id);
          console.log('Webhook created', bookingIds.length, 'new bookings');
        } catch (bookingError) {
          console.error('Error creating bookings from webhook:', bookingError);
        }
      } else {
        console.log('Bookings already exist for this payment');
      }
    }

    // Send acknowledgment to PhonePe
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        transactionId: merchantTransactionId,
        status: newStatus,
        bookingsCreated: bookingIds.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Payment webhook error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Webhook processing failed',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}) 