import { BookingService, PaymentService } from '../index';

export const generateBookingReport = async (
  startDate: string,
  endDate: string
): Promise<any> => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Get all bookings between dates
  const bookings = BookingService.getAll().filter(booking => {
    const bookingDate = new Date(booking.booking_date);
    return bookingDate >= start && bookingDate <= end;
  });
  
  // Group by status
  const byStatus = bookings.reduce((acc: any, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {});
  
  // Group by day
  const byDay = bookings.reduce((acc: any, booking) => {
    const date = booking.booking_date.toString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
  
  // Calculate revenue
  let revenue = 0;
  for (const booking of bookings) {
    const payment = PaymentService.getByBookingId(booking.id);
    if (payment && payment.status === 'success') {
      revenue += payment.amount;
    }
  }
  
  return {
    totalBookings: bookings.length,
    byStatus,
    byDay,
    revenue
  };
};

export const generateRevenueReport = async (
  startDate: string,
  endDate: string
): Promise<any> => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Get all payments between dates
  const payments = PaymentService.getAll().filter(payment => {
    const paymentDate = new Date(payment.paid_at);
    return paymentDate >= start && paymentDate <= end;
  });
  
  const successfulPayments = payments.filter(p => p.status === 'success');
  const failedPayments = payments.filter(p => p.status === 'failed');
  const refundedPayments = payments.filter(p => p.status === 'refunded');
  
  const totalRevenue = successfulPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalRefunded = refundedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  
  return {
    totalPayments: payments.length,
    successfulPayments: successfulPayments.length,
    failedPayments: failedPayments.length,
    refundedPayments: refundedPayments.length,
    totalRevenue,
    totalRefunded,
    netRevenue: totalRevenue - totalRefunded,
    paymentMethods: successfulPayments.reduce((acc: any, payment) => {
      acc[payment.payment_method] = (acc[payment.payment_method] || 0) + 1;
      return acc;
    }, {})
  };
}; 