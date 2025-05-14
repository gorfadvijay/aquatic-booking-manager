import { Payment, UUID } from '@/types/schema';
import { PaymentService, BookingService, UserService, NotificationService } from '../index';

export const recordPayment = async (
  bookingId: UUID, 
  paymentDetails: {
    payment_id: string;
    amount: number;
    currency: string;
    status: 'success' | 'failed';
    payment_method: string;
  }
): Promise<Payment> => {
  const payment = PaymentService.create({
    booking_id: bookingId,
    payment_id: paymentDetails.payment_id,
    amount: paymentDetails.amount,
    currency: paymentDetails.currency,
    status: paymentDetails.status,
    payment_method: paymentDetails.payment_method,
    paid_at: new Date().toISOString()
  });
  
  // If payment is successful, send confirmation
  if (paymentDetails.status === 'success') {
    const booking = BookingService.getById(bookingId);
    if (booking) {
      const user = UserService.getById(booking.user_id);
      if (user) {
        // Send email confirmation
        NotificationService.create({
          user_id: user.id,
          channel: 'email',
          type: 'confirmation',
          message: `Your payment of ${paymentDetails.amount} ${paymentDetails.currency} for booking on ${booking.booking_date} has been received.`
        });
        
        // Send WhatsApp confirmation in a real app
        NotificationService.create({
          user_id: user.id,
          channel: 'whatsapp',
          type: 'confirmation',
          message: `Your payment of ${paymentDetails.amount} ${paymentDetails.currency} for booking on ${booking.booking_date} has been received.`
        });
      }
    }
  }
  
  return payment;
};

export const getPaymentByBookingId = async (bookingId: UUID): Promise<Payment | undefined> => {
  return PaymentService.getByBookingId(bookingId);
}; 