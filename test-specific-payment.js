// Test the specific payment from the PhonePe screenshot
console.log('🎯 TESTING SPECIFIC PAYMENT VERIFICATION');
console.log('=========================================\n');

const FUNCTION_URL = 'https://sbpswmrjgieicdxnjnhc.supabase.co/functions/v1';

async function testSpecificPayment() {
  // This is the exact merchantOrderId from your PhonePe screenshot
  const merchantOrderId = 'OM1750684195543612481';
  
  console.log('🆔 Testing Payment ID:', merchantOrderId);
  console.log('   ✓ From PhonePe payment completion');
  console.log('   ✓ Amount: ₹149.99');
  console.log('   ✓ Status: "success" with "ybl" UPI');
  
  try {
    console.log('\n📞 Calling verify-payment edge function...');
    const response = await fetch(`${FUNCTION_URL}/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Testing without auth header since the function should work standalone
      },
      body: JSON.stringify({ merchantOrderId: merchantOrderId })
    });
    
    console.log('📡 Response Status:', response.status);
    
    const responseText = await response.text();
    console.log('📋 Raw Response:', responseText);
    
    if (response.status === 200) {
      try {
        const result = JSON.parse(responseText);
        console.log('\n✅ VERIFICATION FUNCTION WORKING!');
        console.log('   ✓ Success:', result.success);
        console.log('   ✓ State:', result.state);
        console.log('   ✓ Status:', result.status);
        console.log('   ✓ Message:', result.message);
        console.log('   ✓ Transaction ID:', result.transactionId);
        console.log('   ✓ Amount:', result.amount);
        
        if (result.bookingIds && result.bookingIds.length > 0) {
          console.log('   ✓ Booking IDs:', result.bookingIds);
          console.log('\n🎉 BOOKINGS CREATED SUCCESSFULLY!');
        } else {
          console.log('   ⚠️  No booking IDs returned');
        }
        
        return result;
      } catch (parseError) {
        console.log('❌ Failed to parse response JSON');
        return null;
      }
    } else if (response.status === 401) {
      console.log('❌ 401 Authorization error - Edge function needs proper auth');
      return null;
    } else {
      console.log('❌ Unexpected status:', response.status);
      console.log('   Response body:', responseText);
      return null;
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return null;
  }
}

async function checkPaymentDatabase() {
  console.log('\n📊 Checking payments database...');
  
  try {
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5Mjc5MDEsImV4cCI6MjA1MDUwMzkwMX0.H_KwdQm8VIGpxOGBOFNYlw8TGG3_3r-8xPK2B3SWBH4';
    
    const response = await fetch('https://sbpswmrjgieicdxnjnhc.supabase.co/rest/v1/payments?select=*&order=created_at.desc&limit=10', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    
    if (response.status === 200) {
      const responseText = await response.text();
      try {
        const payments = JSON.parse(responseText);
        console.log('✅ Database query successful');
        console.log('   ✓ Total payment records:', payments.length);
        
        // Look for our specific payment
        const ourPayment = payments.find(p => p.transaction_id === 'OM1750684195543612481');
        if (ourPayment) {
          console.log('\n🎯 FOUND OUR PAYMENT!');
          console.log('   ✓ Transaction ID:', ourPayment.transaction_id);
          console.log('   ✓ Amount:', ourPayment.amount);
          console.log('   ✓ Status:', ourPayment.status);
          console.log('   ✓ Created:', ourPayment.created_at);
          console.log('   ✓ Has metadata:', !!ourPayment.booking_metadata);
        } else {
          console.log('\n❌ OUR PAYMENT NOT FOUND IN DATABASE');
          console.log('   - This means create-payment-order didn\'t store the payment');
          console.log('   - Or there was an issue with the payment creation');
        }
        
        console.log('\n📋 Recent payments:');
        payments.slice(0, 5).forEach((payment, index) => {
          console.log(`   ${index + 1}. ${payment.transaction_id} - ₹${payment.amount} - ${payment.status}`);
        });
        
      } catch (parseError) {
        console.log('❌ Failed to parse payments response');
      }
    } else {
      console.log('❌ Database query failed:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Database error:', error.message);
  }
}

async function runTest() {
  console.log('🚀 DEBUGGING PAYMENT VERIFICATION');
  console.log('=================================\n');
  
  console.log('🎯 What we\'re testing:');
  console.log('1. Verify if edge function responds correctly');
  console.log('2. Check if payment was stored in database');
  console.log('3. Understand why verification isn\'t working\n');
  
  const verificationResult = await testSpecificPayment();
  await checkPaymentDatabase();
  
  console.log('\n📋 DIAGNOSIS:');
  console.log('=============');
  
  if (verificationResult && verificationResult.success) {
    console.log('✅ Edge function is working');
    console.log('✅ Payment verification successful');
    console.log('✅ The issue is likely in your frontend');
    console.log('\n🔧 SOLUTION:');
    console.log('- Your app should call the verification when loading the payment page');
    console.log('- Make sure your dev server is running on port 8080');
    console.log('- Check browser console for any JavaScript errors');
  } else {
    console.log('❌ Edge function has issues');
    console.log('❌ Payment verification not working');
    console.log('\n🔧 SOLUTION:');
    console.log('- Check Supabase function logs');
    console.log('- Verify function deployment');
    console.log('- Check authorization headers');
  }
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Check if server is running: http://localhost:8080');
  console.log('2. Test the URL: http://localhost:8080/customer/payment?merchantOrderId=OM1750684195543612481');
  console.log('3. Check browser console for errors');
  console.log('4. Check Supabase function logs');
}

runTest().catch(console.error); 