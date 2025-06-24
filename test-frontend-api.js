// Test frontend API call simulation
console.log('🎯 TESTING FRONTEND API SIMULATION');
console.log('==================================\n');

const FUNCTION_URL = 'https://sbpswmrjgieicdxnjnhc.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5Mjc5MDEsImV4cCI6MjA1MDUwMzkwMX0.H_KwdQm8VIGpxOGBOFNYlw8TGG3_3r-8xPK2B3SWBH4';

async function simulateFrontendCall() {
  const merchantOrderId = 'OM1750684195543612481';
  
  console.log('🔄 Simulating frontend API call...');
  console.log('   ✓ Using proper authorization header');
  console.log('   ✓ Merchant Order ID:', merchantOrderId);
  
  try {
    const response = await fetch(`${FUNCTION_URL}/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ merchantOrderId: merchantOrderId })
    });
    
    console.log('\n📡 Response Status:', response.status);
    
    const responseText = await response.text();
    console.log('📋 Response Body:', responseText);
    
    if (response.status === 200) {
      try {
        const result = JSON.parse(responseText);
        console.log('\n✅ API CALL SUCCESSFUL!');
        console.log('   ✓ Success:', result.success);
        console.log('   ✓ State:', result.state);
        console.log('   ✓ Message:', result.message);
        
        if (result.bookingIds && result.bookingIds.length > 0) {
          console.log('   ✓ Booking IDs:', result.bookingIds);
          console.log('\n🎉 BOOKINGS WERE CREATED!');
        }
        
        return result;
      } catch (parseError) {
        console.log('❌ Failed to parse JSON response');
      }
    } else {
      console.log('❌ API call failed with status:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
  
  return null;
}

async function testDatabaseDirectly() {
  console.log('\n📊 Testing database access...');
  
  try {
    const response = await fetch('https://sbpswmrjgieicdxnjnhc.supabase.co/rest/v1/payments?select=*&order=created_at.desc&limit=5', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.status === 200) {
      const responseText = await response.text();
      const payments = JSON.parse(responseText);
      
      console.log('✅ Database access working');
      console.log('   ✓ Payment records found:', payments.length);
      
      const targetPayment = payments.find(p => p.transaction_id === 'OM1750684195543612481');
      if (targetPayment) {
        console.log('\n🎯 FOUND TARGET PAYMENT!');
        console.log('   ✓ Transaction ID:', targetPayment.transaction_id);
        console.log('   ✓ Amount: ₹' + targetPayment.amount);
        console.log('   ✓ Status:', targetPayment.status);
        console.log('   ✓ Has booking metadata:', !!targetPayment.booking_metadata);
        
        if (targetPayment.booking_metadata) {
          console.log('   ✓ Metadata content:', JSON.stringify(targetPayment.booking_metadata, null, 2));
        }
      } else {
        console.log('\n❌ TARGET PAYMENT NOT FOUND');
        console.log('   - Payment was not stored during create-payment-order');
        console.log('   - Check create-payment-order function logs');
      }
      
    } else {
      console.log('❌ Database access failed:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Database error:', error.message);
  }
}

async function runSimulation() {
  console.log('🚀 FRONTEND API SIMULATION');
  console.log('==========================\n');
  
  const apiResult = await simulateFrontendCall();
  await testDatabaseDirectly();
  
  console.log('\n📋 SIMULATION RESULTS:');
  console.log('======================');
  
  if (apiResult && apiResult.success) {
    console.log('✅ Verify-payment API working correctly');
    console.log('✅ Your frontend should be able to call this successfully');
    console.log('\n🔧 FRONTEND ISSUES TO CHECK:');
    console.log('1. Dev server running on port 8080?');
    console.log('2. Payment component loading correctly?');
    console.log('3. useEffect triggered with merchantOrderId?');
    console.log('4. Check browser console for JavaScript errors');
  } else {
    console.log('❌ API still has issues');
    console.log('❌ Need to debug edge function further');
  }
  
  console.log('\n🎯 NEXT ACTIONS:');
  console.log('1. Visit: http://localhost:8080/customer/payment?merchantOrderId=OM1750684195543612481');
  console.log('2. Open browser dev tools (F12)');
  console.log('3. Check Console tab for any errors');
  console.log('4. Check Network tab for API calls');
  console.log('5. Look for the verify-payment API call');
}

runSimulation().catch(console.error); 