import { BookingStatus } from '@/types/schema';
import { storage } from './storage';

export const ReportService = {
  getBookingsByDate: (startDate: Date, endDate: Date) => {
    return Array.from(storage.bookings.values()).filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return bookingDate >= startDate && bookingDate <= endDate;
    });
  },
  
  getBookingsByStatus: (status: BookingStatus) => {
    return Array.from(storage.bookings.values()).filter(booking => booking.status === status);
  },
  
  getPaymentsByDate: (startDate: Date, endDate: Date) => {
    return Array.from(storage.payments.values()).filter(payment => {
      const paymentDate = new Date(payment.paid_at);
      return paymentDate >= startDate && paymentDate <= endDate;
    });
  },
  
  getInvoicesByDate: (startDate: Date, endDate: Date) => {
    return Array.from(storage.invoices.values()).filter(invoice => {
      const invoiceDate = new Date(invoice.generated_at);
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });
  },
  
  // Revenue summary
  calculateRevenueSummary: (startDate: Date, endDate: Date) => {
    const payments = ReportService.getPaymentsByDate(startDate, endDate);
    
    const totalRevenue = payments
      .filter(p => p.status === 'success')
      .reduce((sum, payment) => sum + payment.amount, 0);
      
    const totalRefunded = payments
      .filter(p => p.status === 'refunded')
      .reduce((sum, payment) => sum + payment.amount, 0);
      
    return {
      totalRevenue,
      totalRefunded,
      netRevenue: totalRevenue - totalRefunded,
      successfulPayments: payments.filter(p => p.status === 'success').length,
      failedPayments: payments.filter(p => p.status === 'failed').length,
      refundedPayments: payments.filter(p => p.status === 'refunded').length
    };
  },
  
  // Booking summary
  calculateBookingSummary: (startDate: Date, endDate: Date) => {
    const bookings = ReportService.getBookingsByDate(startDate, endDate);
    
    return {
      totalBookings: bookings.length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      rescheduledBookings: bookings.filter(b => b.status === 'rescheduled').length,
      activeBookings: bookings.filter(b => b.status === 'booked').length,
    };
  }
}; 