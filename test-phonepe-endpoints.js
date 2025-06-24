// Test script to check PhonePe endpoint accessibility
const crypto = require('crypto');

const endpoints = [
  'https://api-preprod.phonepe.com/apis/pg-sandbox',
  'https://api-preprod.phonepe.com/apis/hermes',
  'https://mercury-uat.phonepe.com/enterprise-sandbox',
  'https://api.phonepe.com/apis/pg'
];

// Test credentials
const merchantId = 'PGTESTPAYUAT';
const saltKey = '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
const saltIndex = '1';

// Generate test payload
const testPayload = {
  merchantId: merchantId,
  transactionId: 'TEST-' + Date.now(),
  amount: 10000, // 100 INR in paise
  merchantUserId: 'MUID123',
  redirectUrl: 'https://example.com/callback',
  redirectMode: 'POST',
  paymentInstrument: {
    type: 'PAY_PAGE'
  }
};

const base64Payload = Buffer.from(JSON.stringify(testPayload)).toString('base64');
const endpoint = '/pg/v1/pay';
const checksumString = base64Payload + endpoint + saltKey;
const checksum = crypto.createHash('sha256').update(checksumString).digest('hex') + '###' + saltIndex;

async function testEndpoint(baseUrl) {
  try {
    console.log(`\nTesting: ${baseUrl}${endpoint}`);
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum
      },
      body: JSON.stringify({
        request: base64Payload
      })
    });

    console.log(`Status: ${response.status}`);
    
    const responseText = await response.text();
    console.log(`Response: ${responseText.substring(0, 200)}...`);
    
    if (response.status !== 404) {
      console.log('✅ This endpoint is accessible!');
    } else {
      console.log('❌ 404 - Endpoint not found');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('Testing PhonePe endpoints...');
  console.log('Payload:', JSON.stringify(testPayload, null, 2));
  console.log('Base64:', base64Payload);
  console.log('Checksum:', checksum);
  
  for (const url of endpoints) {
    await testEndpoint(url);
  }
}

runTests(); 