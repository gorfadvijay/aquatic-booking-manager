const SUPABASE_URL = 'https://sbpswmrjgieicdxnjnhc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDMxMjIsImV4cCI6MjA2Mjc3OTEyMn0.oUA0JCGySdxnR7-i-mhZpHoGsmXlbYqK4q1S_dpGjyM';

async function testEnumFix() {
  console.log('🧪 Testing payment_status enum fix...\n');
  
  const testPayment = {
    transaction_id: `TEST_ENUM_FIX_${Date.now()}`,
    amount: 149.99,
    status: 'pending'  // This should work after the enum fix
  };
  
  try {
    console.log('1️⃣ Testing payment creation with "pending" status...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testPayment)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Payment created successfully with pending status!');
      console.log('   Payment ID:', result[0].id);
      console.log('   Status:', result[0].status);
      
      // Test updating to success
      console.log('\n2️⃣ Testing status update to "success"...');
      
      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/payments?id=eq.${result[0].id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ status: 'success' })
      });
      
      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        console.log('✅ Status updated to success successfully!');
        console.log('   New status:', updateResult[0].status);
      } else {
        const updateError = await updateResponse.text();
        console.log('❌ Failed to update status:', updateError);
      }
      
      // Clean up - delete test payment
      console.log('\n3️⃣ Cleaning up test data...');
      const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/payments?id=eq.${result[0].id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      if (deleteResponse.ok) {
        console.log('✅ Test data cleaned up successfully');
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ Payment creation failed:', errorText);
      
      if (errorText.includes('invalid input value for enum')) {
        console.log('\n⚠️  ENUM ISSUE STILL EXISTS!');
        console.log('   You need to run the migration 005_fix_payment_status_enum.sql');
        console.log('   Go to Supabase Dashboard > SQL Editor and run the migration');
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Also test edge function creation
async function testEdgeFunctionCreation() {
  console.log('\n📡 Testing create-payment-order edge function...\n');
  
  const testPayload = {
    amount: 149.99,
    userDetails: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '9876543210'
    }
  };
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.json();
    console.log('Edge function response:', result);
    
    if (result.success) {
      console.log('✅ Edge function working - payment order created');
      console.log('   Order ID:', result.merchantOrderId);
    } else {
      console.log('❌ Edge function failed:', result.error);
      if (result.error && result.error.includes('enum')) {
        console.log('   This confirms the enum issue needs to be fixed!');
      }
    }
    
  } catch (error) {
    console.log('❌ Edge function test failed:', error.message);
  }
}

async function runAllTests() {
  await testEnumFix();
  await testEdgeFunctionCreation();
  console.log('\n🏁 All tests completed!');
}

runAllTests(); 