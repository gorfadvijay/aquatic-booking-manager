const SUPABASE_URL = 'https://sbpswmrjgieicdxnjnhc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDMxMjIsImV4cCI6MjA2Mjc3OTEyMn0.oUA0JCGySdxnR7-i-mhZpHoGsmXlbYqK4q1S_dpGjyM';

async function fixPaymentBookingLinks() {
  console.log('🔧 Fixing payment-booking links...\n');
  
  try {
    // Step 1: Find all successful payments with null booking_id
    console.log('1️⃣ Finding payments with null booking_id...');
    
    const paymentsResponse = await fetch(`${SUPABASE_URL}/rest/v1/payments?status=eq.success&booking_id=is.null&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (!paymentsResponse.ok) {
      throw new Error('Could not fetch payments');
    }
    
    const payments = await paymentsResponse.json();
    console.log(`📊 Found ${payments.length} payments with null booking_id`);
    
    if (payments.length === 0) {
      console.log('✅ All payments already have booking_id linked!');
      return;
    }
    
    // Step 2: For each payment, find related bookings and link them
    for (const payment of payments) {
      console.log(`\n🔍 Processing payment: ${payment.transaction_id}`);
      
      if (!payment.booking_metadata || !payment.booking_metadata.userDetails) {
        console.log('   ⚠️  No booking metadata or user details, skipping...');
        continue;
      }
      
      const userEmail = payment.booking_metadata.userDetails.email;
      
      // Find user by email
      const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${userEmail}&select=id`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      if (!userResponse.ok) {
        console.log('   ❌ Could not find user');
        continue;
      }
      
      const users = await userResponse.json();
      if (users.length === 0) {
        console.log('   ❌ User not found');
        continue;
      }
      
      const userId = users[0].id;
      console.log(`   ✅ Found user: ${userId}`);
      
      // Find bookings for this user that were created around the same time as the payment
      const paymentTime = new Date(payment.created_at);
      const searchStartTime = new Date(paymentTime.getTime() - 10 * 60 * 1000); // 10 minutes before
      const searchEndTime = new Date(paymentTime.getTime() + 60 * 60 * 1000); // 60 minutes after
      
      const bookingsResponse = await fetch(`${SUPABASE_URL}/rest/v1/bookings?user_id=eq.${userId}&created_at=gte.${searchStartTime.toISOString()}&created_at=lte.${searchEndTime.toISOString()}&select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      if (bookingsResponse.ok) {
        const bookings = await bookingsResponse.json();
        console.log(`   📊 Found ${bookings.length} bookings in time range`);
        
        if (bookings.length > 0) {
          // Link to the first booking (primary booking)
          const primaryBooking = bookings[0];
          
          console.log(`   🔗 Linking payment to booking: ${primaryBooking.id}`);
          
          const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/payments?id=eq.${payment.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              booking_id: primaryBooking.id
            })
          });
          
          if (updateResponse.ok) {
            console.log(`   ✅ Successfully linked payment ${payment.transaction_id} to booking ${primaryBooking.id}`);
          } else {
            const error = await updateResponse.text();
            console.log(`   ❌ Failed to link payment: ${error}`);
          }
        } else {
          console.log('   ⚠️  No bookings found in time range');
        }
      } else {
        console.log('   ❌ Could not fetch bookings');
      }
    }
    
    // Step 3: Verify the fixes
    console.log('\n3️⃣ Verifying fixes...');
    
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/payments?status=eq.success&select=transaction_id,booking_id,amount&order=created_at.desc&limit=5`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (verifyResponse.ok) {
      const verifyPayments = await verifyResponse.json();
      console.log('\n📊 Current payment status:');
      
      verifyPayments.forEach(payment => {
        const status = payment.booking_id ? '✅ LINKED' : '❌ NULL';
        console.log(`   ${payment.transaction_id} - ${status} - Booking ID: ${payment.booking_id || 'NULL'} - Amount: ₹${payment.amount}`);
      });
      
      const nullCount = verifyPayments.filter(p => !p.booking_id).length;
      if (nullCount === 0) {
        console.log('\n🎉 SUCCESS! All payments now have booking_id linked!');
      } else {
        console.log(`\n⚠️  Still ${nullCount} payments with null booking_id`);
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

fixPaymentBookingLinks(); 