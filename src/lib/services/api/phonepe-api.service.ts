import { env } from '@/lib/environment';

const SUPABASE_FUNCTIONS_URL = `${env.supabaseUrl}/functions/v1`;

export interface CreatePaymentOrderRequest {
  merchantOrderId: string;
  amount: number;
  userDetails: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  bookingMetadata?: {
    daysInfo: Array<{
      date: string;
      slot: {
        id: string;
      };
    }>;
    startTime: string;
    endTime: string;
    userId?: string;
    userDetails?: {
      name: string;
      email: string;
      phone: string;
    };
  };
}

export interface CreatePaymentOrderResponse {
  success: boolean;
  orderId?: string;
  paymentUrl?: string;
  merchantOrderId?: string;
  state?: string;
  message?: string;
  error?: string;
  code?: string;
  details?: any;
}

export interface VerifyPaymentRequest {
  merchantOrderId: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  status?: string;
  state?: string;
  amount?: number;
  orderId?: string;
  merchantOrderId?: string;
  paymentMethod?: string;
  bookingIds?: string[];
  transactionId?: string;
  message?: string;
  isMock?: boolean;
  error?: string;
}

export const createPaymentOrder = async (
  orderData: CreatePaymentOrderRequest
): Promise<CreatePaymentOrderResponse> => {
  try {
    console.log('Creating PhonePe payment order:', {
      merchantOrderId: orderData.merchantOrderId,
      amount: orderData.amount,
      userEmail: orderData.userDetails.email
    });
    
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-payment-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.supabaseAnonKey}`,
      },
      body: JSON.stringify(orderData),
    });

    console.log('PhonePe API response status:', response.status);
    
    // Get the response text first to see what we're getting
    const responseText = await response.text();
    console.log('Raw PhonePe API response:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      return {
        success: false,
        error: `Invalid JSON response: ${responseText}`
      };
    }

    console.log('Parsed PhonePe API response:', result);

    if (!response.ok) {
      // Handle specific error codes as per PhonePe documentation
      if (result.code === 'BAD_REQUEST') {
        return {
          success: false,
          error: 'Invalid request parameters',
          message: result.message,
          code: result.code
        };
      }

      if (result.code === 'INTERNAL_SERVER_ERROR') {
        return {
          success: false,
          error: 'PhonePe server error',
          message: 'There is an error trying to process your transaction. Please try again.',
          code: result.code
        };
      }

      return {
        success: false,
        error: result.error || `HTTP error! status: ${response.status}`,
        code: result.code,
        details: result.details
      };
    }

    return result;
  } catch (error) {
    console.error('Error creating PhonePe payment order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export const verifyPayment = async (
  verificationData: VerifyPaymentRequest
): Promise<VerifyPaymentResponse> => {
  try {
    console.log('Verifying PhonePe payment:', verificationData.merchantOrderId);
    
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.supabaseAnonKey}`,
      },
      body: JSON.stringify(verificationData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Payment verification failed:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    console.log('Payment verification result:', result);
    return result;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Check order status as per PhonePe documentation
export const checkOrderStatus = async (
  merchantOrderId: string
): Promise<VerifyPaymentResponse> => {
  try {
    console.log('Checking PhonePe order status:', merchantOrderId);
    
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/check-order-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.supabaseAnonKey}`,
      },
      body: JSON.stringify({ merchantOrderId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error checking order status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Generate unique merchant order ID (Transaction ID)
export const generateMerchantOrderId = (): string => {
  // Generate transaction ID in PhonePe format based on your examples:
  // Transaction ID: OMO2506121655350042754165
  // Merchant Reference ID: OMPL2506121655349852754170
  // PhonePe Transaction ID: OM2506121657002300601975
  
  const timestamp = Date.now().toString(); // Full timestamp
  const random = Math.random().toString().slice(2, 8); // 6 random digits
  return `OM${timestamp}${random}`;
};

// Test function for PhonePe integration
export const testPhonePeFlow = async () => {
  const testOrder: CreatePaymentOrderRequest = {
    merchantOrderId: generateMerchantOrderId(),
    amount: 149.99,
    userDetails: {
      id: 'test-user-123',
      name: 'Test User',
      email: 'test@example.com',
      phone: '9999999999'
    }
  };

  console.log('Testing PhonePe payment flow...');
  const orderResult = await createPaymentOrder(testOrder);
  console.log('Order creation result:', orderResult);
  
  if (orderResult.success && orderResult.merchantOrderId) {
    console.log('Testing payment verification...');
    const verifyResult = await verifyPayment({ 
      merchantOrderId: orderResult.merchantOrderId 
    });
    console.log('Verification result:', verifyResult);
  }
}; 