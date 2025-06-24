const SUPABASE_URL = 'https://sbpswmrjgieicdxnjnhc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDMxMjIsImV4cCI6MjA2Mjc3OTEyMn0.oUA0JCGySdxnR7-i-mhZpHoGsmXlbYqK4q1S_dpGjyM';

async function checkEnumStatus() {
  console.log('🔍 Checking if payment_status enum has been fixed...\n');
  
  const testPayment = {
    transaction_id: `ENUM_CHECK_${Date.now()}`,
    payment_id: `PAYMENT_CHECK_${Date.now()}`,
    amount: 10.00,
    status: 'pending',
    payment_method: 'phonepe'
  };
  
  try {
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
      console.log('✅ ENUM IS FIXED! Payment with "pending" status created successfully');
      console.log('   Payment ID:', result[0].id);
      
      // Clean up
      await fetch(`${SUPABASE_URL}/rest/v1/payments?id=eq.${result[0].id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      return true;
    } else {
      const error = await response.text();
      console.log('❌ ENUM STILL NOT FIXED');
      console.log('Error:', error);
      
      if (error.includes('invalid input value for enum payment_status: "pending"')) {
        console.log('\n🚨 URGENT: You must apply the database migration!');
        console.log('📋 Go to Supabase Dashboard > SQL Editor and run:');
        console.log('');
        console.log('ALTER TYPE payment_status ADD VALUE IF NOT EXISTS \'pending\';');
        console.log('ALTER TYPE payment_status ADD VALUE IF NOT EXISTS \'completed\';');
        console.log('');
      }
      
      return false;
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Also check if there are any existing payment records for the failed order
async function checkFailedOrder() {
  console.log('\n🔍 Checking for existing payment records...\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/payments?select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const payments = await response.json();
      console.log(`📊 Found ${payments.length} payment records in database`);
      
      if (payments.length > 0) {
        console.log('Recent payments:');
        payments.slice(-5).forEach(payment => {
          console.log(`   ${payment.transaction_id} - ${payment.status} - ${payment.amount}`);
        });
      }
    } else {
      console.log('❌ Could not fetch payment records');
    }
  } catch (error) {
    console.log('❌ Error checking payments:', error.message);
  }
}

async function runCheck() {
  const isFixed = await checkEnumStatus();
  await checkFailedOrder();
  
  if (!isFixed) {
    console.log('\n🚨 CRITICAL ACTION NEEDED:');
    console.log('1. Go to https://sbpswmrjgieicdxnjnhc.supabase.co/project/sbpswmrjgieicdxnjnhc/sql');
    console.log('2. Paste the migration SQL and run it');
    console.log('3. Redeploy all edge functions');
    console.log('4. Test payment flow again');
  } else {
    console.log('\n✅ Enum is fixed! Payment flow should now work.');
  }
}

runCheck(); 