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

// Generate checksum for verification
const generateChecksum = async (endpoint: string, saltKey: string, saltIndex: string): Promise<string> => {
  const stringToHash = endpoint + saltKey;
  console.log('Generating verification checksum for endpoint:', endpoint);
  
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const checksum = `${hash}###${saltIndex}`;
  
  return checksum;
};

// Create user in Supabase
const createUser = async (supabase: any, userDetails: any) => {
  console.log('Creating/finding user:', userDetails.email);
  
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('email', userDetails.email)
    .single();

  if (existingUser) {
    console.log('User already exists:', existingUser.id);
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
    console.error('Error creating user:', createError);
    throw new Error(`Failed to create user: ${createError.message}`);
  }

  console.log('User created successfully:', newUser.id);
  return newUser;
};

// Create bookings after payment verification
const createBookings = async (supabase: any, bookingMetadata: any, userId: string, paymentId: string, paymentAmount: number) => {
  console.log('Creating bookings with metadata for user:', userId);
  
  if (!bookingMetadata || (!bookingMetadata.selectedDates && !bookingMetadata.daysInfo)) {
    throw new Error('Invalid booking metadata - no booking dates found');
  }

  const bookingIds = [];
  
  // Handle both new format (selectedDates) and old format (daysInfo)
  let daysToProcess = [];
  if (bookingMetadata.selectedDates) {
    // New format from updated payment flow
    daysToProcess = bookingMetadata.selectedDates.map((dateStr: string) => ({
      date: dateStr,
      slotId: bookingMetadata.slotId
    }));
  } else if (bookingMetadata.daysInfo) {
    // Old format for backwards compatibility
    daysToProcess = bookingMetadata.daysInfo.map((dayInfo: any) => ({
      date: dayInfo.date,
      slotId: dayInfo.slot?.id
    }));
  }
  
  console.log('Processing bookings for', daysToProcess.length, 'days');
  
  for (const dayInfo of daysToProcess) {
    if (dayInfo.slotId) {
      const bookingData = {
        user_id: userId,
        slot_id: dayInfo.slotId,
        booking_date: dayInfo.date,
        start_time: bookingMetadata.startTime,
        end_time: bookingMetadata.endTime,
        amount_paid: paymentAmount
      };
      
      console.log('Creating booking for date:', dayInfo.date);
      
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) {
        console.error('Error creating booking for date', dayInfo.date, ':', error);
        throw new Error(`Failed to create booking for ${dayInfo.date}: ${error.message}`);
      }

      bookingIds.push(booking.id);
      console.log('Booking created successfully:', booking.id);
    }
  }

  return bookingIds;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== PhonePe Payment Verification ===');

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { merchantOrderId } = await req.json()
    
    if (!merchantOrderId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing merchantOrderId' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Verifying payment for:', merchantOrderId);

    // Initialize Supabase - Try environment variables first, fallback to hardcoded
    const supabaseUrl = 'https://sbpswmrjgieicdxnjnhc.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDMxMjIsImV4cCI6MjA2Mjc3OTEyMn0.oUA0JCGySdxnR7-i-mhZpHoGsmXlbYqK4q1S_dpGjyM';
    
    console.log('Using Supabase URL:', supabaseUrl);
    console.log('Using Supabase Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generate verification checksum

    const endpoint = `/pg/v1/status/${PHONEPE_CONFIG.merchantId}/${merchantOrderId}`;
    const checksum = await generateChecksum(endpoint, PHONEPE_CONFIG.saltKey, PHONEPE_CONFIG.saltIndex);
    
    const requestUrl = `${PHONEPE_CONFIG.baseUrl}${endpoint}`;
    const requestHeaders = {
      'Content-Type': 'application/json',
      'X-VERIFY': checksum,
      'X-MERCHANT-ID': PHONEPE_CONFIG.merchantId,
      'Accept': 'application/json'
    };

    console.log('Making verification request to:', requestUrl);

    try {
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: requestHeaders
      });

      console.log('Verification response status:', response.status);
      
      const responseText = await response.text();
      console.log('Raw verification response:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse verification response');
        throw new Error('Invalid response from PhonePe verification API');
      }

      console.log('Parsed verification response:', result);

      if (!result.success) {
        throw new Error(`Payment verification failed: ${result.message || result.code}`);
      }

      const paymentData = result.data;
      if (paymentData.state !== 'COMPLETED') {
        throw new Error(`Payment not completed. Current state: ${paymentData.state}`);
      }

      // Get payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('transaction_id', merchantOrderId)
        .single();

      if (paymentError || !payment) {
        console.error('Payment record not found:', paymentError);
        throw new Error('Payment record not found in database');
      }

      console.log('Found payment record:', { id: payment.id, status: payment.status, amount: payment.amount });

              // Update payment status
        const { error: updateError } = await supabase
          .from('payments')
          .update({ 
            status: 'success',
            phonepe_response: result,
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id);

      if (updateError) {
        console.error('Error updating payment status:', updateError);
        throw new Error('Failed to update payment status');
      }

      // Create user and bookings if metadata exists
      let bookingIds = [];
      if (payment.booking_metadata) {
        try {
          const user = await createUser(supabase, payment.booking_metadata.userDetails);
          bookingIds = await createBookings(supabase, payment.booking_metadata, user.id, payment.id, payment.amount);
          console.log('Successfully created', bookingIds.length, 'bookings');
          
          // Link the payment to the first booking created
          if (bookingIds.length > 0) {
            const primaryBookingId = bookingIds[0];
            const { error: linkError } = await supabase
              .from('payments')
              .update({ booking_id: primaryBookingId })
              .eq('id', payment.id);
              
            if (linkError) {
              console.error('Failed to link payment to booking:', linkError);
            } else {
              console.log(`✅ Payment ${payment.id} linked to booking: ${primaryBookingId}`);
            }
          }
        } catch (bookingError) {
          console.error('Error creating bookings:', bookingError);
          // Don't fail the entire payment verification if booking creation fails
          // The payment is still successful
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          state: paymentData.state,
          status: 'COMPLETED',
          message: 'Payment verified successfully',
          bookingIds: bookingIds,
          transactionId: paymentData.transactionId,
          amount: paymentData.amount / 100 // Convert from paise to rupees
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (verificationError) {
      console.error('Payment verification failed:', verificationError);
      throw verificationError;
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Payment verification failed'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}) 