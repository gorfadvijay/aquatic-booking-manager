import { v4 as uuidv4 } from 'uuid';
import { User, Booking, Payment, UUID } from '@/types/schema';
import { supabase } from '../../supabase';
import { 
  UserService, 
  BookingService, 
  PaymentService, 
  NotificationService 
} from '../index';

export const createBooking = async (
  userData: Omit<User, 'id' | 'is_admin' | 'is_verified' | 'otp_code' | 'otp_expiry' | 'created_at'>,
  slotId: UUID, 
  bookingDate: string,
  startTime: string,
  endTime: string
): Promise<{ booking: Booking; paymentUrl: string }> => {
  try {
    // Check if user exists in Supabase, if not create one
    let userId;
    const { data: existingUsers, error: userSearchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .limit(1);
    
    if (userSearchError) {
      console.error('Error searching for user:', userSearchError);
      throw userSearchError;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      userId = existingUsers[0].id;
    } else {
      // Create new user
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert([{
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          dob: userData.dob || null,
          is_admin: false,
          is_verified: false
        }])
        .select();
      
      if (createUserError) {
        console.error('Error creating user:', createUserError);
        throw createUserError;
      }
      
      userId = newUser[0].id;
    }

    // Create booking in Supabase
    const bookingData = {
      user_id: userId,
      slot_id: slotId,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime
    };
    
    const { data: newBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select();
    
    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      throw bookingError;
    }

    // In a real app, this would create a payment session with a payment processor
    const paymentUrl = `https://api.payment-processor.com/checkout/${uuidv4()}`;

    return { booking: newBooking[0] as Booking, paymentUrl };
  } catch (error) {
    console.error('Error in createBooking:', error);
    throw error;
  }
};

export const getBooking = async (id: UUID): Promise<Booking | undefined> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching booking:', error);
      return undefined;
    }
    
    return data as Booking;
  } catch (error) {
    console.error('Error in getBooking:', error);
    return undefined;
  }
};

export const getUserBookings = async (userId: UUID): Promise<Booking[]> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user bookings:', error);
      return [];
    }
    
    return data as Booking[];
  } catch (error) {
    console.error('Error in getUserBookings:', error);
    return [];
  }
};

export const getAllBookings = async (): Promise<Booking[]> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*');
    
    if (error) {
      console.error('Error fetching all bookings:', error);
      return [];
    }
    
    return data as Booking[];
  } catch (error) {
    console.error('Error in getAllBookings:', error);
    return [];
  }
};

export const getBookingsByDate = async (date: string): Promise<Booking[]> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', date);
    
    if (error) {
      console.error('Error fetching bookings by date:', error);
      return [];
    }
    
    return data as Booking[];
  } catch (error) {
    console.error('Error in getBookingsByDate:', error);
    return [];
  }
};

export const cancelBooking = async (
  bookingId: UUID, 
  reason: string
): Promise<Booking | undefined> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        cancel_reason: reason
      })
      .eq('id', bookingId)
      .select()
      .single();
    
    if (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
    
    // In a real implementation, add payment refund and notification logic here
    
    return data as Booking;
  } catch (error) {
    console.error('Error in cancelBooking:', error);
    throw error;
  }
};

export const rescheduleBooking = async (
  bookingId: UUID,
  newDate: string,
  newStartTime: string,
  newEndTime: string
): Promise<Booking> => {
  try {
    // Get the original booking
    const { data: originalBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    
    if (fetchError || !originalBooking) {
      console.error('Error fetching original booking:', fetchError);
      throw new Error('Original booking not found');
    }
    
    // Create a new booking
    const { data: newBooking, error: createError } = await supabase
      .from('bookings')
      .insert([{
        user_id: originalBooking.user_id,
        slot_id: originalBooking.slot_id,
        booking_date: newDate,
        start_time: newStartTime,
        end_time: newEndTime
      }])
      .select();
    
    if (createError || !newBooking) {
      console.error('Error creating new booking:', createError);
      throw createError;
    }
    
    // Mark the original as rescheduled
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        rescheduled_to: newBooking[0].id
      })
      .eq('id', bookingId);
    
    if (updateError) {
      console.error('Error updating original booking:', updateError);
      throw updateError;
    }
    
    // In a real implementation, add notification logic here
    
    return newBooking[0] as Booking;
  } catch (error) {
    console.error('Error in rescheduleBooking:', error);
    throw error;
  }
}; 