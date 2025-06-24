const SUPABASE_URL = 'https://sbpswmrjgieicdxnjnhc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDMxMjIsImV4cCI6MjA2Mjc3OTEyMn0.oUA0JCGySdxnR7-i-mhZpHoGsmXlbYqK4q1S_dpGjyM';

async function createBookingsForPayment() {
  console.log('🔧 Manually creating bookings for existing payment...\n');
  
  try {
    // Get the successful payment record
    console.log('1️⃣ Fetching successful payment record...');
    
    const paymentsResponse = await fetch(`${SUPABASE_URL}/rest/v1/payments?status=eq.success&booking_id=is.null&order=created_at.desc&limit=1&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (!paymentsResponse.ok) {
      throw new Error('Could not fetch payment records');
    }
    
    const payments = await paymentsResponse.json();
    if (payments.length === 0) {
      console.log('❌ No successful payments without bookings found');
      return;
    }
    
    const payment = payments[0];
    console.log('✅ Found payment:', {
      id: payment.id,
      transaction_id: payment.transaction_id,
      amount: payment.amount,
      status: payment.status
    });
    
    if (!payment.booking_metadata) {
      console.log('❌ Payment has no booking metadata');
      return;
    }
    
    const metadata = payment.booking_metadata;
    console.log('✅ Has booking metadata for', metadata.daysInfo.length, 'days');
    
    // Step 2: Create user if needed
    console.log('\n2️⃣ Creating/finding user...');
    
    const userDetails = metadata.userDetails;
    
    // Check if user already exists
    const existingUserResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${userDetails.email}&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    let userId;
    
    if (existingUserResponse.ok) {
      const users = await existingUserResponse.json();
      if (users.length > 0) {
        userId = users[0].id;
        console.log('✅ Found existing user:', userId);
      } else {
        // Create new user
        console.log('Creating new user...');
        const createUserResponse = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            name: userDetails.name,
            email: userDetails.email,
            phone: userDetails.phone,
            is_verified: true
          })
        });
        
        if (createUserResponse.ok) {
          const newUser = await createUserResponse.json();
          userId = newUser[0].id;
          console.log('✅ Created new user:', userId);
        } else {
          const error = await createUserResponse.text();
          console.log('❌ Failed to create user:', error);
          return;
        }
      }
    }
    
    // Step 3: Create bookings
    console.log('\n3️⃣ Creating bookings...');
    
    const bookingIds = [];
    
    for (const dayInfo of metadata.daysInfo) {
      console.log(`Creating booking for ${dayInfo.date} with slot ${dayInfo.slot.id}...`);
      
      const bookingData = {
        user_id: userId,
        slot_id: dayInfo.slot.id,
        booking_date: dayInfo.date,
        start_time: metadata.startTime,
        end_time: metadata.endTime
      };
      
      const bookingResponse = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(bookingData)
      });
      
      if (bookingResponse.ok) {
        const booking = await bookingResponse.json();
        bookingIds.push(booking[0].id);
        console.log(`✅ Created booking ${booking[0].id} for ${dayInfo.date}`);
      } else {
        const error = await bookingResponse.text();
        console.log(`❌ Failed to create booking for ${dayInfo.date}:`, error);
      }
    }
    
    console.log(`\n✅ Created ${bookingIds.length} bookings successfully!`);
    
    // Step 4: Update payment record with first booking ID
    if (bookingIds.length > 0) {
      console.log('\n4️⃣ Linking payment to bookings...');
      
      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/payments?id=eq.${payment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          booking_id: bookingIds[0] // Link to first booking
        })
      });
      
      if (updateResponse.ok) {
        console.log('✅ Payment linked to booking:', bookingIds[0]);
      } else {
        console.log('❌ Failed to link payment to booking');
      }
    }
    
    console.log('\n🎉 BOOKING CREATION COMPLETED!');
    console.log(`✅ Payment: ${payment.transaction_id}`);
    console.log(`✅ User: ${userId}`);
    console.log(`✅ Bookings: ${bookingIds.join(', ')}`);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

createBookingsForPayment(); 