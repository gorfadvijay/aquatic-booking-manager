// Test PhonePe Credentials
const crypto = require('crypto');

// Your PhonePe credentials
const merchantId = 'TEST-M2342E2P0D51P_25061';
const saltKey = 'ZWE1NTZiYWEtZGIwYS00YjQ1LTk4MmUtMDY5ZjM3N2Y3NGJo';
const saltIndex = '1';

// Test payload
const testPayload = {
  merchantId: merchantId,
  merchantTransactionId: 'TEST_TXN_123',
  merchantUserId: 'test_user_123',
  amount: 100, // 1 rupee in paisa
  redirectUrl: 'http://localhost:5173/payment-success',
  redirectMode: 'REDIRECT',
  callbackUrl: 'https://sbpswmrjgieicdxnjnhc.supabase.co/functions/v1/payment-webhook',
  mobileNumber: '9999999999',
  paymentInstrument: {
    type: 'PAY_PAGE'
  }
};

console.log('Testing PhonePe Credentials:');
console.log('Merchant ID:', merchantId);
console.log('Salt Key:', saltKey.substring(0, 20) + '...');
console.log('Salt Index:', saltIndex);
console.log('');

// Create base64 payload
const payloadString = JSON.stringify(testPayload);
const base64Payload = Buffer.from(payloadString).toString('base64');

console.log('Payload String:', payloadString);
console.log('Base64 Payload:', base64Payload);
console.log('');

// Create checksum
const checksumString = base64Payload + '/pg/v1/pay' + saltKey;
const checksum = crypto.createHash('sha256').update(checksumString).digest('hex') + '###' + saltIndex;

console.log('Checksum String:', checksumString.substring(0, 50) + '...');
console.log('Final Checksum:', checksum);
console.log('');

// Create the request body
const requestBody = {
  request: base64Payload
};

console.log('Request Body:', JSON.stringify(requestBody, null, 2));
console.log('');
console.log('Headers:');
console.log('Content-Type: application/json');
console.log('X-VERIFY:', checksum);
console.log('accept: application/json');
console.log('');
console.log('URL: https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay'); 