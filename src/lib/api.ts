
import { v4 as uuidv4 } from 'uuid';
import { addMinutes } from 'date-fns';
import {
  UserService,
  SlotService,
  SlotExceptionService,
  BookingService,
  PaymentService,
  InvoiceService,
  NotificationService
} from './mockDb';

import type {
  User,
  Slot,
  SlotException,
  Booking,
  Payment,
  Invoice,
  Notification,
  UUID,
  NotificationChannel,
  NotificationType,
  BookingStatus
} from '@/types/schema';

// Export the services so they can be used directly
export {
  UserService,
  SlotService,
  SlotExceptionService,
  BookingService,
  PaymentService,
  InvoiceService,
  NotificationService
};

// ===== User APIs =====

export const registerUser = async (userData: {
  name: string;
  email: string;
  phone: string;
  dob: string;
}): Promise<{ user: User; otp: string }> => {
  // Check if user already exists
  const existingUser = UserService.getByEmail(userData.email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = addMinutes(new Date(), 10); // OTP valid for 10 minutes

  // Create user
  const user = UserService.create({
    ...userData,
    is_admin: false,
    is_verified: false,
    otp_code: otp,
    otp_expiry: otpExpiry.toISOString(),
  });

  // Send notification (in a real app, this would go to an email/SMS service)
  NotificationService.create({
    user_id: user.id,
    channel: 'email',
    type: 'otp',
    message: `Your OTP is ${otp}. It is valid for 10 minutes.`
  });

  console.log(`Registration OTP for ${user.email}: ${otp}`);
  
  return { user, otp };
};

export const verifyOTP = async (email: string, otp: string): Promise<User | null> => {
  const isVerified = UserService.verifyOTP(email, otp);
  if (isVerified) {
    const user = UserService.getByEmail(email);
    return user || null;
  }
  return null;
};

export const resendOTP = async (email: string): Promise<string> => {
  const user = UserService.getByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }

  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = addMinutes(new Date(), 10);

  // Update user
  UserService.update(user.id, {
    otp_code: otp,
    otp_expiry: otpExpiry.toISOString()
  });

  // Send notification
  NotificationService.create({
    user_id: user.id,
    channel: 'email',
    type: 'otp',
    message: `Your new OTP is ${otp}. It is valid for 10 minutes.`
  });

  console.log(`New OTP for ${user.email}: ${otp}`);
  
  return otp;
};

// ===== Slot Management APIs =====

export const createSlot = async (slotData: {
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_holiday: boolean;
  created_by: UUID;
}): Promise<Slot> => {
  return SlotService.create(slotData);
};

export const updateSlot = async (
  id: UUID,
  data: Partial<Slot>
): Promise<{ slot: Slot; conflicts: Booking[] }> => {
  // Check for conflicts with existing bookings
  const conflicts = BookingService.getActiveBookingsForSlot(id);
  
  // Update the slot
  const slot = SlotService.update(id, data);
  if (!slot) {
    throw new Error('Slot not found');
  }
  
  return { slot, conflicts };
};

export const createSlotException = async (
  exceptionData: Omit<SlotException, 'id'>
): Promise<SlotException> => {
  return SlotExceptionService.create(exceptionData);
};

export const getAllSlots = async (): Promise<Slot[]> => {
  return SlotService.getAll();
};

export const getSlotById = async (id: UUID): Promise<Slot | undefined> => {
  return SlotService.getById(id);
};

// ===== Booking APIs =====

export const createBooking = async (
  userData: Omit<User, 'id' | 'is_admin' | 'is_verified' | 'otp_code' | 'otp_expiry' | 'created_at'>,
  slotId: UUID, 
  bookingDate: string,
  startTime: string,
  endTime: string
): Promise<{ booking: Booking; paymentUrl: string }> => {
  // Check if user exists, if not create one
  let user = UserService.getByEmail(userData.email);
  if (!user) {
    user = UserService.create({
      ...userData,
      is_admin: false,
      is_verified: false,
      otp_code: null,
      otp_expiry: null
    });
  }

  // Create booking
  const booking = BookingService.create({
    user_id: user.id,
    slot_id: slotId,
    booking_date: bookingDate,
    start_time: startTime,
    end_time: endTime,
    status: 'booked',
    rescheduled_to: null,
    cancel_reason: null
  });

  // In a real app, this would create a payment session with Razorpay
  const paymentUrl = `https://api.razorpay.com/v1/checkout/embedded/${uuidv4()}`;

  return { booking, paymentUrl };
};

export const getBooking = async (id: UUID): Promise<Booking | undefined> => {
  return BookingService.getById(id);
};

export const getUserBookings = async (userId: UUID): Promise<Booking[]> => {
  return BookingService.getByUserId(userId);
};

export const getAllBookings = async (): Promise<Booking[]> => {
  return BookingService.getAll();
};

export const getBookingsByDate = async (date: string): Promise<Booking[]> => {
  return BookingService.getByDate(date);
};

export const cancelBooking = async (
  bookingId: UUID, 
  reason: string
): Promise<Booking | undefined> => {
  const booking = BookingService.cancel(bookingId, reason);
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  // Check if payment exists and refund it
  const payment = PaymentService.getByBookingId(bookingId);
  if (payment && payment.status === 'success') {
    PaymentService.refund(payment.id);
    
    // Send refund notification
    const user = UserService.getById(booking.user_id);
    if (user) {
      NotificationService.create({
        user_id: user.id,
        channel: 'email',
        type: 'refund',
        message: `Your booking has been cancelled and a refund of ${payment.amount} ${payment.currency} has been initiated.`
      });
    }
  }
  
  return booking;
};

export const rescheduleBooking = async (
  bookingId: UUID,
  newDate: string,
  newStartTime: string,
  newEndTime: string
): Promise<Booking> => {
  // Get the original booking
  const originalBooking = BookingService.getById(bookingId);
  if (!originalBooking) {
    throw new Error('Original booking not found');
  }
  
  // Create a new booking
  const newBooking = BookingService.create({
    user_id: originalBooking.user_id,
    slot_id: originalBooking.slot_id,
    booking_date: newDate,
    start_time: newStartTime,
    end_time: newEndTime,
    status: 'booked',
    rescheduled_to: null,
    cancel_reason: null
  });
  
  // Mark the original as rescheduled
  BookingService.reschedule(bookingId, newBooking.id);
  
  // Notify user
  const user = UserService.getById(originalBooking.user_id);
  if (user) {
    NotificationService.create({
      user_id: user.id,
      channel: 'email',
      type: 'confirmation',
      message: `Your booking has been rescheduled to ${newDate} from ${newStartTime} to ${newEndTime}.`
    });
  }
  
  return newBooking;
};

// ===== Payment APIs =====

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

// ===== Invoice APIs =====

export const generateInvoice = async (
  bookingId: UUID, 
  generatedBy: UUID,
  amount: number
): Promise<Invoice> => {
  // Check if booking exists
  const booking = BookingService.getById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  // Generate invoice number
  const invoiceNumber = InvoiceService.generateInvoiceNumber();
  
  // Create invoice
  const invoice = InvoiceService.create({
    booking_id: bookingId,
    invoice_number: invoiceNumber,
    generated_by: generatedBy,
    amount: amount,
    generated_at: new Date().toISOString(),
    sent_via_email: false,
    sent_via_whatsapp: false
  });
  
  return invoice;
};

export const sendInvoice = async (
  invoiceId: UUID, 
  channels: NotificationChannel[]
): Promise<Invoice | undefined> => {
  const invoice = InvoiceService.getById(invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  
  const booking = BookingService.getById(invoice.booking_id);
  if (!booking) {
    throw new Error('Associated booking not found');
  }
  
  const user = UserService.getById(booking.user_id);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Send notifications based on channels
  const updates: Partial<Invoice> = {};
  
  for (const channel of channels) {
    NotificationService.create({
      user_id: user.id,
      channel: channel,
      type: 'invoice',
      message: `Your invoice #${invoice.invoice_number} for the amount of ${invoice.amount} has been generated.`
    });
    
    if (channel === 'email') {
      updates.sent_via_email = true;
    } else if (channel === 'whatsapp') {
      updates.sent_via_whatsapp = true;
    }
  }
  
  // Update invoice with sent status
  return InvoiceService.update(invoiceId, updates);
};

export const getInvoiceByBookingId = async (bookingId: UUID): Promise<Invoice | undefined> => {
  return InvoiceService.getByBookingId(bookingId);
};

// ===== Notification APIs =====

export const sendNotification = async (
  userId: UUID, 
  channel: NotificationChannel,
  type: NotificationType,
  message: string
): Promise<Notification> => {
  return NotificationService.create({
    user_id: userId,
    channel,
    type,
    message
  });
};

export const getUserNotifications = async (userId: UUID): Promise<Notification[]> => {
  return NotificationService.getByUserId(userId);
};

// ===== Reports APIs =====

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
