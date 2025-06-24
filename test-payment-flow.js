// Test script for the payment flow and booking creation after payment success
const SUPABASE_URL = 'https://sbpswmrjgieicdxnjnhc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3MDQ1NDUsImV4cCI6MjA1MTI4MDU0NX0.NNI-CnQVxZNEBrvNiKLLaGWUuF0NXEF8TtAfzg0VkYM';

// Test data
const testBookingMetadata = {
  daysInfo: [
    {
      date: '2024-01-15',
      slot: { id: 'test-slot-1' }
    },
    {
      date: '2024-01-16', 
      slot: { id: 'test-slot-2' }
    },
    {
      date: '2024-01-17',
      slot: { id: 'test-slot-3' }
    }
  ],
  startTime: '09:00',
  endTime: '10:00',
  userId: 'test-user-123',
  userDetails: {
    name: 'Test User',
    email: 'test@example.com',
    phone: '9999999999'
  }
};

const testPaymentOrder = {
  bookingId: 'test-booking-' + Date.now(),
  amount: 149.99,
  userDetails: {
    id: 'test-user-123',
    name: 'Test User',
    email: 'test@example.com',
    phone: '9999999999'
  },
  bookingMetadata: testBookingMetadata
};

console.log('Testing Payment Flow with Booking Creation...');
console.log('Test Data:', JSON.stringify(testPaymentOrder, null, 2));

// Test 1: Create Payment Order
async function testCreatePaymentOrder() {
  console.log('\n=== Test 1: Create Payment Order ===');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(testPaymentOrder)
    });

    const result = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success && result.transactionId) {
      console.log('✅ Payment order created successfully');
      return result.transactionId;
    } else {
      console.log('❌ Payment order creation failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating payment order:', error);
    return null;
  }
}

// Test 2: Verify Payment (simulating successful payment)
async function testVerifyPayment(transactionId) {
  console.log('\n=== Test 2: Verify Payment ===');
  
  if (!transactionId) {
    console.log('❌ No transaction ID available for verification');
    return;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ transactionId })
    });

    const result = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Payment verification completed');
      if (result.bookingIds && result.bookingIds.length > 0) {
        console.log('✅ Bookings created:', result.bookingIds);
      } else {
        console.log('⚠️ Payment verified but no bookings created');
      }
    } else {
      console.log('❌ Payment verification failed');
    }
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
  }
}

// Run the tests
async function runTests() {
  const transactionId = await testCreatePaymentOrder();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  await testVerifyPayment(transactionId);
  
  console.log('\n=== Test Summary ===');
  console.log('Tests completed. Check the results above for any issues.');
  console.log('If payment order creation succeeded but verification failed,');
  console.log('it might be because PhonePe sandbox is not returning success status.');
  console.log('The booking creation logic should work when actual payments succeed.');
}

runTests(); 