const SUPABASE_URL = 'https://sbpswmrjgieicdxnjnhc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDMxMjIsImV4cCI6MjA2Mjc3OTEyMn0.oUA0JCGySdxnR7-i-mhZpHoGsmXlbYqK4q1S_dpGjyM';

async function checkBookingsSchema() {
  console.log('🔍 Checking bookings table schema...\n');
  
  try {
    // Test with minimal required fields
    const testBooking = {
      user_id: '00000000-0000-0000-0000-000000000000',
      slot_id: '00000000-0000-0000-0000-000000000000',
      booking_date: '2025-06-25'
    };
    
    console.log('Testing minimal booking creation...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testBooking)
    });
    
    if (response.ok) {
      const booking = await response.json();
      console.log('✅ Minimal booking created successfully!');
      console.log('Schema works with:', Object.keys(testBooking));
      
      // Clean up
      await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${booking[0].id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
    } else {
      const error = await response.text();
      console.log('❌ Minimal booking failed:', error);
      
      // Try with different field combinations
      const fieldTests = [
        { user_id: '00000000-0000-0000-0000-000000000000', slot_id: '00000000-0000-0000-0000-000000000000', booking_date: '2025-06-25', start_time: '15:00', end_time: '16:00' },
        { user_id: '00000000-0000-0000-0000-000000000000', slot_id: '00000000-0000-0000-0000-000000000000', booking_date: '2025-06-25', start_time: '15:00:00', end_time: '16:00:00' }
      ];
      
      for (let i = 0; i < fieldTests.length; i++) {
        console.log(`\nTesting field combination ${i + 1}:`, Object.keys(fieldTests[i]));
        
        const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(fieldTests[i])
        });
        
        if (testResponse.ok) {
          const booking = await testResponse.json();
          console.log('✅ This combination works!');
          console.log('Required fields:', Object.keys(fieldTests[i]));
          
          // Clean up
          await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${booking[0].id}`, {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          });
          break;
          
        } else {
          const error = await testResponse.text();
          console.log('❌ Failed:', error);
        }
      }
    }
    
    // Also check if we can fetch existing bookings to see the schema
    console.log('\n📊 Checking existing bookings...');
    
    const existingResponse = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (existingResponse.ok) {
      const bookings = await existingResponse.json();
      if (bookings.length > 0) {
        console.log('✅ Found existing booking with structure:');
        console.log(JSON.stringify(bookings[0], null, 2));
      } else {
        console.log('📭 No existing bookings found');
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

checkBookingsSchema(); 