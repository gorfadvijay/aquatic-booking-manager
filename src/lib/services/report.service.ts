import { BookingStatus } from '@/types/schema';
import { supabase } from '../supabase';
import { format } from 'date-fns';

export const ReportService = {
  getBookingsByDate: async (startDate: Date, endDate: Date) => {
    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .gte('booking_date', formattedStartDate)
        .lte('booking_date', formattedEndDate);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting bookings by date:', error);
      return [];
    }
  },
  
  getBookingsByStatus: async (status: BookingStatus) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', status);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting bookings by status:', error);
      return [];
    }
  },
  
  getPaymentsByDate: async (startDate: Date, endDate: Date) => {
    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .gte('paid_at', formattedStartDate)
        .lte('paid_at', formattedEndDate);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting payments by date:', error);
      return [];
    }
  },
  
  getInvoicesByDate: async (startDate: Date, endDate: Date) => {
    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .gte('generated_at', formattedStartDate)
        .lte('generated_at', formattedEndDate);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting invoices by date:', error);
      return [];
    }
  },
  
  // Revenue summary
  calculateRevenueSummary: async (startDate: Date, endDate: Date) => {
    try {
      const payments = await ReportService.getPaymentsByDate(startDate, endDate);
      
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
    } catch (error) {
      console.error('Error calculating revenue summary:', error);
      return {
        totalRevenue: 0,
        totalRefunded: 0,
        netRevenue: 0,
        successfulPayments: 0,
        failedPayments: 0,
        refundedPayments: 0
      };
    }
  },
  
  // Booking summary
  calculateBookingSummary: async (startDate: Date, endDate: Date) => {
    try {
      const bookings = await ReportService.getBookingsByDate(startDate, endDate);
      
      return {
        totalBookings: bookings.length,
        completedBookings: bookings.filter(b => b.status === 'completed').length,
        cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
        rescheduledBookings: bookings.filter(b => b.status === 'rescheduled').length,
        activeBookings: bookings.filter(b => b.status === 'booked').length,
      };
    } catch (error) {
      console.error('Error calculating booking summary:', error);
      return {
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        rescheduledBookings: 0,
        activeBookings: 0,
      };
    }
  }
}; 