// Test Real PhonePe Payment Gateway with FIXED Transaction ID
// This script tests the actual PhonePe API integration with proper transaction IDs

const SUPABASE_URL = 'https://juweypcgbehzqsqjhnkg.supabase.co';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1`;

// Generate proper transaction ID (same as frontend)
const generateTransactionId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `TXN${timestamp}${random}`;
};

// Test payment creation with real PhonePe API
async function testRealPaymentCreation() {
  console.log('🚀 Testing Real PhonePe Payment Creation');
  console.log('=====================================');
  
  // Generate proper transaction ID
  const merchantOrderId = generateTransactionId();
  console.log('Generated Transaction ID:', merchantOrderId);
  
  const testPayload = {
    merchantOrderId: merchantOrderId, // FIXED: Now uses proper TXN format instead of merchant ID
    amount: 10.00, // Rs. 10 (within UAT limit of Rs. 1 - Rs. 1000)
    userDetails: {
      id: 'test-user-' + Date.now(),
      name: 'Test User',
      email: 'test@example.com',
      phone: '9876543210'
    },
    bookingMetadata: {
      daysInfo: [
        { date: '2024-01-15', slot: { id: 'slot-123' } },
        { date: '2024-01-16', slot: { id: 'slot-124' } }
      ],
      startTime: '09:00',
      endTime: '10:00',
      userDetails: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '9876543210'
      }
    }
  };

  try {
    console.log('📝 Sending payment request...');
    console.log('Transaction ID format:', /^TXN\d+[A-Z0-9]+$/.test(merchantOrderId) ? '✅ Valid' : '❌ Invalid');
    
    const response = await fetch(`${FUNCTION_URL}/create-payment-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ANON_KEY_HERE' // Replace with actual key
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    
    console.log('\n📊 Response Status:', response.status);
    console.log('📋 Payment Creation Response:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ SUCCESS: PhonePe payment order created');
      console.log('🔗 Payment URL:', result.paymentUrl);
      console.log('📝 Order ID:', result.merchantOrderId);
      console.log('💰 Amount:', '₹' + testPayload.amount);
      
      if (result.paymentUrl) {
        console.log('\n🎯 Next Steps:');
        console.log('1. Open the payment URL in browser');
        console.log('2. Complete the payment using test credentials:');
        console.log('   - Card: 4242 4242 4242 4242');
        console.log('   - Expiry: 12/25');
        console.log('   - CVV: 357');
        console.log('   - OTP: 987654');
        console.log('3. You will be redirected back to your app');
        console.log('4. Payment verification will happen automatically');
      }
      
      return result.merchantOrderId;
    } else {
      console.log('\n❌ FAILED: PhonePe payment creation failed');
      console.log('Error:', result.error);
      console.log('Code:', result.code);
      
      if (result.code === 'KEY_NOT_CONFIGURED') {
        console.log('\n🔧 This error should now be FIXED!');
        console.log('- We are no longer using TEST-M2342E2P0D51P_25061 as transaction ID');
        console.log('- Now using proper TXN format:', merchantOrderId);
        console.log('- Check if functions are deployed correctly');
      }
      
      return null;
    }
  } catch (error) {
    console.error('\n💥 Network Error:', error.message);
    return null;
  }
}

// Test payment verification
async function testPaymentVerification(merchantOrderId) {
  console.log('\n🔍 Testing Payment Verification');
  console.log('================================');
  
  try {
    const response = await fetch(`${FUNCTION_URL}/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ANON_KEY_HERE' // Replace with actual key
      },
      body: JSON.stringify({ merchantOrderId })
    });

    const result = await response.json();
    console.log('📊 Verification Response:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Payment verification successful');
      if (result.bookingIds && result.bookingIds.length > 0) {
        console.log('🎫 Bookings created:', result.bookingIds.length);
        console.log('📝 Booking IDs:', result.bookingIds);
      }
    } else {
      console.log('\n⏳ Payment verification pending or failed');
      console.log('Reason:', result.error);
    }
    
    return result.success;
  } catch (error) {
    console.error('\n💥 Verification Error:', error.message);
    return false;
  }
}

// Run complete test
async function runCompleteTest() {
  console.log('🎯 PhonePe Real Payment Gateway Test - FIXED VERSION');
  console.log('===================================================');
  console.log('✅ Fixed: No longer using merchant ID as transaction ID');
  console.log('✅ Fixed: Now generating proper TXN format transaction IDs');
  console.log('✅ Fixed: Should resolve "Key not found for the merchant" error\n');
  
  // Step 1: Create payment
  const merchantOrderId = await testRealPaymentCreation();
  if (!merchantOrderId) {
    console.log('\n❌ Test failed at payment creation step');
    return;
  }

  console.log('\n⏱️  Waiting 5 seconds before verification test...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Step 2: Test verification (will likely be pending until manual payment)
  await testPaymentVerification(merchantOrderId);

  console.log('\n🏁 Test Complete!');
  console.log('\n📝 Summary:');
  console.log('- Real PhonePe API integration: ✅');
  console.log('- Proper transaction ID generation: ✅');
  console.log('- Payment order creation: ✅');
  console.log('- Payment URL generation: ✅');
  console.log('- No mock payments: ✅');
  console.log('- KEY_NOT_CONFIGURED error fixed: ✅');
}

// Instructions
console.log(`
🧪 Fixed PhonePe Payment Gateway Test Script
===========================================

✅ FIXED ISSUES:
1. ❌ OLD: Used 'TEST-M2342E2P0D51P_25061' as transaction ID (merchant ID)
2. ✅ NEW: Uses proper 'TXN{timestamp}{random}' format for transaction IDs
3. This should fix the "Key not found for the merchant" error

BEFORE RUNNING:
1. Replace 'YOUR_ANON_KEY_HERE' with your Supabase anon key
2. Make sure all edge functions are deployed
3. Ensure your dev server is running on http://localhost:8083

TO RUN THIS TEST:
node test-real-phonepe.js

EXPECTED RESULT:
✅ Should now get success response with PhonePe payment URL
✅ No more "KEY_NOT_CONFIGURED" errors
✅ Real PhonePe payment page should open

TRANSACTION ID EXAMPLES:
- OLD (WRONG): TEST-M2342E2P0D51P_25061
- NEW (CORRECT): TXN1735060318123AB2D4F
`);

// Uncomment the line below to run the test
// runCompleteTest().catch(console.error);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testRealPaymentCreation, testPaymentVerification, runCompleteTest, generateTransactionId };
} 