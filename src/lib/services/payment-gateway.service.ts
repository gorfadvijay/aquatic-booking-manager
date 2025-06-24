import { phonePeApiService } from './api/phonepe-api.service';
import { generateId } from './storage';

export type PaymentGateway = 'razorpay' | 'phonepe';

export interface PaymentOrderRequest {
  bookingId: string;
  amount: number;
  currency?: string;
  mobileNumber?: string;
}

export interface PaymentOrderResponse {
  success: boolean;
  orderId: string;
  redirectUrl?: string; // For PhonePe redirect flow
  razorpayOrderId?: string; // For Razorpay SDK
  merchantTransactionId?: string; // For PhonePe
  gateway: PaymentGateway;
}

export interface PaymentVerificationRequest {
  gateway: PaymentGateway;
  transactionId: string;
  razorpayPaymentId?: string; // For Razorpay
  razorpaySignature?: string; // For Razorpay
  merchantTransactionId?: string; // For PhonePe
}

export interface PaymentVerificationResponse {
  success: boolean;
  status: string;
  transactionId?: string;
  amount?: number;
  paymentMethod: string;
}

class PaymentGatewayService {
  private readonly defaultGateway: PaymentGateway;

  constructor() {
    // Default to PhonePe, can be configured via environment
    this.defaultGateway = (import.meta.env.VITE_DEFAULT_PAYMENT_GATEWAY as PaymentGateway) || 'phonepe';
  }

  async createOrder(
    request: PaymentOrderRequest, 
    gateway: PaymentGateway = this.defaultGateway
  ): Promise<PaymentOrderResponse> {
    try {
      if (gateway === 'phonepe') {
        return await this.createPhonePeOrder(request);
      } else {
        return await this.createRazorpayOrder(request);
      }
    } catch (error) {
      console.error('Payment gateway create order error:', error);
      throw error;
    }
  }

  private async createPhonePeOrder(request: PaymentOrderRequest): Promise<PaymentOrderResponse> {
    try {
      const merchantTransactionId = `TXN_${request.bookingId}_${Date.now()}`;
      const merchantUserId = `USER_${Date.now()}`;
      
      // Convert amount to paise (PhonePe expects amount in paise)
      const amountInPaise = Math.round(request.amount * 100);
      
      // Get current URL for redirect
      const currentUrl = window.location.origin;
      const redirectUrl = `${currentUrl}/customer/payment-success`;
      const callbackUrl = `${currentUrl}/api/phonepe/webhook`; // This would be for server-side
      
      console.log('Creating PhonePe payment order:', {
        merchantTransactionId,
        amount: amountInPaise,
        redirectUrl
      });

      const phonePeResponse = await phonePeApiService.initiatePayment({
        merchantTransactionId,
        merchantUserId,
        amount: amountInPaise,
        redirectUrl,
        redirectMode: 'REDIRECT',
        callbackUrl,
        mobileNumber: request.mobileNumber,
        paymentInstrument: {
          type: 'PAY_PAGE'
        }
      });

      console.log('PhonePe API response:', phonePeResponse);

      if (phonePeResponse.success && phonePeResponse.data?.instrumentResponse?.redirectInfo?.url) {
        // Store payment info in localStorage for verification later
        localStorage.setItem('phonePePayment', JSON.stringify({
          merchantTransactionId,
          bookingId: request.bookingId,
          amount: request.amount,
          timestamp: new Date().toISOString()
        }));

        return {
          success: true,
          orderId: merchantTransactionId,
          redirectUrl: phonePeResponse.data.instrumentResponse.redirectInfo.url,
          merchantTransactionId,
          gateway: 'phonepe'
        };
      } else {
        throw new Error('Failed to create PhonePe payment order');
      }
    } catch (error) {
      console.error('PhonePe order creation error:', error);
      throw error;
    }
  }

  private async createRazorpayOrder(request: PaymentOrderRequest): Promise<PaymentOrderResponse> {
    // For now, return a placeholder for Razorpay
    // You can implement Razorpay integration here later
    throw new Error('Razorpay integration not implemented yet');
  }

  async verifyPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    try {
      if (request.gateway === 'phonepe') {
        return await this.verifyPhonePePayment(request);
      } else {
        return await this.verifyRazorpayPayment(request);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  private async verifyPhonePePayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    try {
      if (!request.merchantTransactionId) {
        throw new Error('Merchant transaction ID is required for PhonePe verification');
      }

      const verificationResponse = await phonePeApiService.verifyPayment(request.merchantTransactionId);
      
      console.log('PhonePe verification response:', verificationResponse);

      let status = 'failed';
      if (verificationResponse.success && verificationResponse.data?.state === 'COMPLETED') {
        status = 'success';
      } else if (verificationResponse.data?.state === 'PENDING') {
        status = 'pending';
      }

      return {
        success: verificationResponse.success,
        status,
        transactionId: verificationResponse.data?.transactionId,
        amount: verificationResponse.data?.amount ? verificationResponse.data.amount / 100 : undefined, // Convert from paise
        paymentMethod: 'phonepe'
      };
    } catch (error) {
      console.error('PhonePe verification error:', error);
      throw error;
    }
  }

  private async verifyRazorpayPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    // Placeholder for Razorpay verification
    throw new Error('Razorpay verification not implemented yet');
  }

  getSupportedGateways(): PaymentGateway[] {
    return ['phonepe']; // Only PhonePe is implemented
  }

  getDefaultGateway(): PaymentGateway {
    return this.defaultGateway;
  }
}

export const paymentGatewayService = new PaymentGatewayService(); 