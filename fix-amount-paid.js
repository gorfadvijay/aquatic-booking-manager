const SUPABASE_URL = 'https://sbpswmrjgieicdxnjnhc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDMxMjIsImV4cCI6MjA2Mjc3OTEyMn0.oUA0JCGySdxnR7-i-mhZpHoGsmXlbYqK4q1S_dpGjyM';

async function fixAmountPaid() {
  console.log('🔧 Checking and fixing amount_paid in bookings...\n');
  
  try {
    // Step 1: Check bookings table structure
    console.log('1️⃣ Checking bookings table structure...');
    
    const bookingsResponse = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (bookingsResponse.ok) {
      const bookings = await bookingsResponse.json();
      if (bookings.length > 0) {
        console.log('📊 Bookings table columns:', Object.keys(bookings[0]));
        
        if ('amount_paid' in bookings[0]) {
          console.log('✅ amount_paid column exists in bookings table');
        } else {
          console.log('❌ amount_paid column does NOT exist in bookings table');
          console.log('💡 This might be why amount_paid is null - the column may not exist');
        }
      }
    }
    
    // Step 2: Check payments and bookings relationship
    console.log('\n2️⃣ Checking payments with bookings...');
    
    const paymentsWithBookingsResponse = await fetch(`${SUPABASE_URL}/rest/v1/payments?status=eq.success&booking_id=not.is.null&select=id,transaction_id,amount,booking_id`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (paymentsWithBookingsResponse.ok) {
      const paymentsWithBookings = await paymentsWithBookingsResponse.json();
      console.log(`📊 Found ${paymentsWithBookings.length} payments with linked bookings`);
      
      for (const payment of paymentsWithBookings) {
        console.log(`\n🔍 Checking payment ${payment.transaction_id} (₹${payment.amount})`);
        
        // Get the linked booking
        const bookingResponse = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${payment.booking_id}&select=*`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        
        if (bookingResponse.ok) {
          const bookingData = await bookingResponse.json();
          if (bookingData.length > 0) {
            const booking = bookingData[0];
            console.log(`   📅 Booking: ${booking.booking_date} ${booking.start_time}-${booking.end_time}`);
            
            if ('amount_paid' in booking) {
              console.log(`   💰 Current amount_paid: ${booking.amount_paid}`);
              
              if (!booking.amount_paid) {
                console.log(`   🔄 Updating amount_paid to ₹${payment.amount}`);
                
                // Update the booking with amount_paid
                const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${booking.id}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                  },
                  body: JSON.stringify({
                    amount_paid: payment.amount
                  })
                });
                
                if (updateResponse.ok) {
                  console.log(`   ✅ Successfully updated amount_paid`);
                } else {
                  const error = await updateResponse.text();
                  console.log(`   ❌ Failed to update amount_paid: ${error}`);
                }
              } else {
                console.log(`   ✅ Amount_paid already set correctly`);
              }
            } else {
              console.log(`   ❌ amount_paid column doesn't exist in booking`);
            }
          }
        }
      }
    }
    
    // Step 3: Check for bookings without linked payments
    console.log('\n3️⃣ Checking for bookings without linked payments...');
    
    const allBookingsResponse = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=id,booking_date,user_id&order=created_at.desc&limit=10`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (allBookingsResponse.ok) {
      const allBookings = await allBookingsResponse.json();
      console.log(`📊 Recent bookings count: ${allBookings.length}`);
      
      for (const booking of allBookings) {
        // Check if this booking has a linked payment
        const linkedPaymentResponse = await fetch(`${SUPABASE_URL}/rest/v1/payments?booking_id=eq.${booking.id}&select=transaction_id,amount`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        
        if (linkedPaymentResponse.ok) {
          const linkedPayments = await linkedPaymentResponse.json();
          if (linkedPayments.length === 0) {
            console.log(`   ⚠️  Booking ${booking.id} (${booking.booking_date}) has no linked payment`);
          } else {
            console.log(`   ✅ Booking ${booking.id} linked to payment ${linkedPayments[0].transaction_id}`);
          }
        }
      }
    }
    
    console.log('\n🎉 Amount paid check/fix completed!');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

fixAmountPaid(); 