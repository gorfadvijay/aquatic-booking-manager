import { v4 as uuidv4 } from 'uuid';
import { User, Booking, Payment, UUID } from '@/types/schema';
import { 
  UserService, 
  BookingService, 
  PaymentService, 
  NotificationService 
} from './index';

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