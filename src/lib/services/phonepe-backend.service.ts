import { env } from '../environment';

export interface PhonePePaymentRequest {
  amount: number; // Amount in paisa
  redirectUrl: string;
  merchantOrderId?: string;
  message?: string;
  expireAfter?: number; // Seconds
  metaInfo?: {
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
  };
}

export interface PhonePePaymentResponse {
  success: boolean;
  message?: string;
  data?: {
    orderId: string;
    state: string;
    expireAt: number;
    redirectUrl: string;
    merchantOrderId: string;
  };
  error?: string;
}

export interface PhonePePaymentStatus {
  success: boolean;
  data?: {
    merchantOrderId: string;
    status: string;
    message: string;
    transactionId?: string;
    amount?: number;
    paymentInstrument?: any;
  };
  error?: string;
}

class PhonePeBackendService {
  private baseUrl: string;

  constructor() {
    // Use environment configuration or fallback to localhost
    this.baseUrl = env.phonepeBackendUrl || 'http://localhost:5000';
  }

  /**
   * Create a payment order with PhonePe backend
   */
  async createPayment(paymentData: PhonePePaymentRequest): Promise<PhonePePaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Payment creation failed');
      }

      return result;
    } catch (error) {
      console.error('PhonePe payment creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed'
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(merchantOrderId: string): Promise<PhonePePaymentStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payment/status/${merchantOrderId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Status check failed');
      }

      return result;
    } catch (error) {
      console.error('PhonePe status check error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed'
      };
    }
  }

  /**
   * Verify payment after redirect
   */
  async verifyPayment(merchantOrderId: string): Promise<PhonePePaymentStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ merchantOrderId })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Payment verification failed');
      }

      return result;
    } catch (error) {
      console.error('PhonePe payment verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment verification failed'
      };
    }
  }

  /**
   * Check backend health
   */
  async checkHealth(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Backend unreachable'
      };
    }
  }

  /**
   * Initialize PhonePe payment flow
   * Convenience method that creates payment and redirects to PhonePe
   */
  async initiatePayment(
    amount: number, // Amount in INR (will be converted to paisa)
    successUrl: string,
    bookingId?: string,
    customerEmail?: string
  ): Promise<void> {
    try {
      const paymentData: PhonePePaymentRequest = {
        amount: amount * 100, // Convert INR to paisa
        redirectUrl: successUrl,
        message: 'Aquatic Booking Payment',
        expireAfter: 1200, // 20 minutes
        metaInfo: {
          udf1: bookingId || '',
          udf2: customerEmail || ''
        }
      };

      const result = await this.createPayment(paymentData);

      if (result.success && result.data?.redirectUrl) {
        // Redirect to PhonePe payment page
        window.location.href = result.data.redirectUrl;
      } else {
        throw new Error(result.error || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('PhonePe payment initiation error:', error);
      throw error;
    }
  }

  /**
   * Handle payment success redirect
   * Call this on your success page to verify the payment
   */
  async handlePaymentReturn(merchantOrderId: string): Promise<{
    success: boolean;
    status: string;
    message: string;
    data?: any;
  }> {
    try {
      const result = await this.verifyPayment(merchantOrderId);

      if (result.success && result.data) {
        return {
          success: true,
          status: result.data.status,
          message: result.data.message,
          data: result.data
        };
      } else {
        return {
          success: false,
          status: 'verification_failed',
          message: result.error || 'Payment verification failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Verification error'
      };
    }
  }
}

// Export singleton instance
export const phonePeBackendService = new PhonePeBackendService();
export default phonePeBackendService; 