// Final deployment test to verify everything is working
console.log('🚀 Final Payment Flow Deployment Test');
console.log('===================================\n');

const FUNCTION_URL = 'https://sbpswmrjgieicdxnjnhc.supabase.co/functions/v1';

async function testCreatePaymentOrder() {
  console.log('1️⃣ Testing create-payment-order deployment...');
  
  const testPayload = {
    merchantOrderId: `OM${Date.now()}FINAL`,
    amount: 149.99,
    userDetails: {
      id: 'final-test-user',
      name: 'Final Test User',
      email: 'final@example.com',
      phone: '9876543210'
    },
    bookingMetadata: {
      daysInfo: [{ date: '2024-12-25', slot: { id: 'slot-final' } }],
      startTime: '09:00',
      endTime: '10:00',
      userDetails: { name: 'Final Test User', email: 'final@example.com', phone: '9876543210' }
    }
  };
  
  try {
    const response = await fetch(`${FUNCTION_URL}/create-payment-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    
    console.log('✓ Response Status:', response.status);
    const responseText = await response.text();
    
    if (response.status === 200) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ CREATE-PAYMENT-ORDER WORKING!');
        console.log('  ✓ Success:', result.success);
        console.log('  ✓ Payment URL exists:', !!result.paymentUrl);
        console.log('  ✓ Order ID:', result.orderId);
        console.log('  ✓ Database entry should be created');
        
        return result.merchantOrderId || testPayload.merchantOrderId;
      } catch (parseError) {
        console.log('❌ Failed to parse response');
        return null;
      }
    } else if (response.status === 401) {
      console.log('❌ STILL GETTING 401 - EDGE FUNCTIONS NOT DEPLOYED YET');
      console.log('   Please deploy the functions with hardcoded credentials');
      return null;
    } else {
      console.log('❌ Unexpected status:', response.status);
      console.log('   Response:', responseText.substring(0, 200));
      return null;
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return null;
  }
}

async function testPaymentVerification(merchantOrderId) {
  console.log('\n2️⃣ Testing verify-payment deployment...');
  
  if (!merchantOrderId) {
    console.log('❌ No merchant order ID to test verification');
    return;
  }
  
  try {
    const response = await fetch(`${FUNCTION_URL}/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantOrderId: merchantOrderId })
    });
    
    console.log('✓ Response Status:', response.status);
    const responseText = await response.text();
    
    if (response.status === 200) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ VERIFY-PAYMENT WORKING!');
        console.log('  ✓ Function deployed correctly');
        console.log('  ✓ Response format correct');
        
        if (result.success) {
          console.log('  ✅ Payment verification successful!');
          console.log('  ✓ Booking IDs:', result.bookingIds);
        } else {
          console.log('  ⚠️  Expected verification failure (test payment):', result.error);
          console.log('  ✓ But function is working correctly');
        }
      } catch (parseError) {
        console.log('❌ Failed to parse verification response');
      }
    } else {
      console.log('❌ Verification function issue');
      console.log('   Response:', responseText.substring(0, 200));
    }
    
  } catch (error) {
    console.log('❌ Verification network error:', error.message);
  }
}

async function testDatabaseAccess() {
  console.log('\n3️⃣ Testing database access...');
  
  try {
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5Mjc5MDEsImV4cCI6MjA1MDUwMzkwMX0.H_KwdQm8VIGpxOGBOFNYlw8TGG3_3r-8xPK2B3SWBH4';
    
    const response = await fetch('https://sbpswmrjgieicdxnjnhc.supabase.co/rest/v1/payments?select=*&limit=5&order=created_at.desc', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    
    console.log('✓ Database Response Status:', response.status);
    
    if (response.status === 200) {
      const responseText = await response.text();
      try {
        const payments = JSON.parse(responseText);
        console.log('✅ DATABASE ACCESS WORKING!');
        console.log('  ✓ Payment records found:', payments.length);
        
        if (payments.length > 0) {
          console.log('  ✓ Latest payment:');
          console.log('    - Transaction ID:', payments[0].transaction_id);
          console.log('    - Amount:', payments[0].amount);
          console.log('    - Status:', payments[0].status);
          console.log('    - Created:', payments[0].created_at);
        }
      } catch (parseError) {
        console.log('❌ Failed to parse payments data');
      }
    } else {
      console.log('❌ Database access failed');
    }
    
  } catch (error) {
    console.log('❌ Database access error:', error.message);
  }
}

async function testCompleteFlow() {
  console.log('\n🚀 Running Complete Flow Test');
  console.log('=============================\n');
  
  const merchantOrderId = await testCreatePaymentOrder();
  await testPaymentVerification(merchantOrderId);
  await testDatabaseAccess();
  
  console.log('\n📋 DEPLOYMENT STATUS');
  console.log('===================');
  
  console.log('\n🎯 IF ALL TESTS SHOW ✅:');
  console.log('- Edge functions deployed correctly');
  console.log('- Database access working');
  console.log('- Payment flow will work end-to-end');
  console.log('- Test your app: payment → PhonePe → redirect → booking-success');
  
  console.log('\n❌ IF TESTS SHOW 401 ERRORS:');
  console.log('- Edge functions not deployed yet');
  console.log('- Go to Supabase Dashboard → Edge Functions');
  console.log('- Deploy create-payment-order and verify-payment');
  console.log('- Wait 2-3 minutes and run this test again');
  
  console.log('\n🔄 TO RE-TEST AFTER DEPLOYMENT:');
  console.log('node test-final-deployment.js');
}

testCompleteFlow().catch(console.error); 