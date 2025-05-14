import { Booking, UUID, BookingStatus } from '@/types/schema';
import { storage, timestamp, generateId } from './storage';

export const BookingService = {
  create: (booking: Omit<Booking, 'id' | 'created_at'>): Booking => {
    const id = generateId();
    const newBooking: Booking = {
      ...booking,
      id,
      created_at: timestamp()
    };
    storage.bookings.set(id, newBooking);
    return newBooking;
  },

  getById: (id: UUID): Booking | undefined => {
    return storage.bookings.get(id);
  },
  
  getByUserId: (userId: UUID): Booking[] => {
    return Array.from(storage.bookings.values())
      .filter(booking => booking.user_id === userId);
  },
  
  getByDate: (date: string): Booking[] => {
    return Array.from(storage.bookings.values())
      .filter(booking => booking.booking_date === date);
  },
  
  getBySlotId: (slotId: UUID): Booking[] => {
    return Array.from(storage.bookings.values())
      .filter(booking => booking.slot_id === slotId);
  },
  
  getActiveBookingsForSlot: (slotId: UUID): Booking[] => {
    // Get bookings that are not cancelled or completed
    return Array.from(storage.bookings.values())
      .filter(booking => 
        booking.slot_id === slotId && 
        (booking.status === 'booked' || booking.status === 'rescheduled') &&
        new Date(booking.booking_date) >= new Date() // Future date
      );
  },

  getAllFuture: (): Booking[] => {
    const now = new Date();
    return Array.from(storage.bookings.values())
      .filter(booking => new Date(booking.booking_date) >= now);
  },
  
  getAll: (): Booking[] => {
    return Array.from(storage.bookings.values());
  },
  
  update: (id: UUID, data: Partial<Booking>): Booking | undefined => {
    const booking = storage.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking = { ...booking, ...data };
    storage.bookings.set(id, updatedBooking);
    return updatedBooking;
  },
  
  cancel: (id: UUID, reason: string): Booking | undefined => {
    const booking = storage.bookings.get(id);
    if (!booking) return undefined;
    
    const cancelledBooking = { 
      ...booking, 
      status: 'cancelled' as const,
      cancel_reason: reason 
    };
    storage.bookings.set(id, cancelledBooking);
    return cancelledBooking;
  },
  
  reschedule: (id: UUID, newBookingId: UUID): Booking | undefined => {
    const booking = storage.bookings.get(id);
    if (!booking) return undefined;
    
    const rescheduledBooking = { 
      ...booking, 
      status: 'rescheduled' as const,
      rescheduled_to: newBookingId 
    };
    storage.bookings.set(id, rescheduledBooking);
    return rescheduledBooking;
  },

  delete: (id: UUID): boolean => {
    return storage.bookings.delete(id);
  }
}; 