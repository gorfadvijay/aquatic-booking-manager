const SUPABASE_URL = 'https://sbpswmrjgieicdxnjnhc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDMxMjIsImV4cCI6MjA2Mjc3OTEyMn0.oUA0JCGySdxnR7-i-mhZpHoGsmXlbYqK4q1S_dpGjyM';

async function testBookingCreation() {
  console.log('🔍 Debugging booking creation issue...\n');
  
  try {
    // Step 1: Check the existing payment record
    console.log('1️⃣ Checking existing payment record...');
    
    const paymentsResponse = await fetch(`${SUPABASE_URL}/rest/v1/payments?select=*&order=created_at.desc&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (paymentsResponse.ok) {
      const payments = await paymentsResponse.json();
      if (payments.length > 0) {
        const payment = payments[0];
        console.log('✅ Found recent payment record:');
        console.log('   ID:', payment.id);
        console.log('   Transaction ID:', payment.transaction_id);
        console.log('   Status:', payment.status);
        console.log('   Booking ID:', payment.booking_id);
        console.log('   Has booking_metadata:', !!payment.booking_metadata);
        
        if (payment.booking_metadata) {
          console.log('   Booking metadata:', JSON.stringify(payment.booking_metadata, null, 2));
          
          // Step 2: Check if the metadata has required fields for booking creation
          const metadata = payment.booking_metadata;
          console.log('\n2️⃣ Analyzing booking metadata...');
          
          if (metadata.userDetails) {
            console.log('✅ Has userDetails:', metadata.userDetails);
          } else {
            console.log('❌ Missing userDetails');
          }
          
          if (metadata.selectedDays && metadata.selectedDays.length > 0) {
            console.log('✅ Has selectedDays:', metadata.selectedDays);
          } else if (metadata.daysInfo && metadata.daysInfo.length > 0) {
            console.log('✅ Has daysInfo:', metadata.daysInfo);
          } else {
            console.log('❌ Missing selectedDays/daysInfo');
          }
          
          if (metadata.startTime && metadata.endTime) {
            console.log('✅ Has time slots:', metadata.startTime, '-', metadata.endTime);
          } else {
            console.log('❌ Missing startTime/endTime');
          }
          
          // Step 3: Check if we have slots available
          console.log('\n3️⃣ Checking available slots...');
          
          const slotsResponse = await fetch(`${SUPABASE_URL}/rest/v1/slots?select=*&limit=5`, {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          });
          
          if (slotsResponse.ok) {
            const slots = await slotsResponse.json();
            console.log(`📊 Found ${slots.length} slots in database`);
            if (slots.length > 0) {
              console.log('   Example slot:', slots[0]);
            }
          }
          
          // Step 4: Check bookings table structure
          console.log('\n4️⃣ Testing direct booking creation...');
          
          const testBooking = {
            user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
            slot_id: '00000000-0000-0000-0000-000000000000', // Test UUID
            booking_date: '2025-06-25',
            start_time: '10:00',
            end_time: '11:00',
            status: 'confirmed'
          };
          
          const testBookingResponse = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(testBooking)
          });
          
          if (testBookingResponse.ok) {
            const booking = await testBookingResponse.json();
            console.log('✅ Booking creation works! Test booking created:', booking[0].id);
            
            // Clean up test booking
            await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${booking[0].id}`, {
              method: 'DELETE',
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
              }
            });
            console.log('✅ Test booking cleaned up');
            
          } else {
            const bookingError = await testBookingResponse.text();
            console.log('❌ Booking creation failed:', bookingError);
          }
          
          // Step 5: Test calling verify-payment function directly
          console.log('\n5️⃣ Testing verify-payment function...');
          
          const verifyResponse = await fetch(`${SUPABASE_URL}/functions/v1/verify-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              merchantOrderId: payment.transaction_id
            })
          });
          
          const verifyResult = await verifyResponse.json();
          console.log('Verify payment result:', verifyResult);
          
        } else {
          console.log('❌ No booking metadata found - this is why bookings are not created');
          console.log('   The payment was created without booking metadata');
        }
        
      } else {
        console.log('❌ No payment records found');
      }
    } else {
      console.log('❌ Could not fetch payment records');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testBookingCreation(); 