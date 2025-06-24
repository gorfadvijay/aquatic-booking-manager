console.log('Testing database connection...');

const SUPABASE_URL = 'https://sbpswmrjgieicdxnjnhc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDMxMjIsImV4cCI6MjA2Mjc3OTEyMn0.oUA0JCGySdxnR7-i-mhZpHoGsmXlbYqK4q1S_dpGjyM';

fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*&limit=1`, {
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  }
})
.then(response => response.json())
.then(data => {
  if (data.length > 0) {
    console.log('✅ Bookings table columns:', Object.keys(data[0]));
    console.log('✅ Has amount_paid:', 'amount_paid' in data[0]);
  } else {
    console.log('❌ No bookings found');
  }
})
.catch(error => {
  console.error('❌ Error:', error);
}); 