import { Booking, UUID, BookingStatus } from '@/types/schema';
import { storage, timestamp, generateId } from './storage';
import { supabase } from '../supabase';

export const BookingService = {
  create: async (booking: Omit<Booking, 'id' | 'created_at'>): Promise<Booking> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([booking])
        .select()
        .single();
        
      if (error) throw error;
      return data as Booking;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  getById: async (id: UUID): Promise<Booking | undefined> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data as Booking;
    } catch (error) {
      console.error('Error getting booking by ID:', error);
      return undefined;
    }
  },
  
  getBookingsBySlotId: async (slotId: UUID): Promise<Booking[]> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('slot_id', slotId);
        
      if (error) throw error;
      return data as Booking[];
    } catch (error) {
      console.error('Error getting bookings by slot ID:', error);
      return [];
    }
  },

  getByUserId: async (userId: UUID): Promise<Booking[]> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId);
        
      if (error) throw error;
      return data as Booking[];
    } catch (error) {
      console.error('Error getting bookings by user ID:', error);
      return [];
    }
  },

  getAllFutureBookings: async (): Promise<Booking[]> => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .gte('booking_date', today)
        .order('booking_date', { ascending: true });
        
      if (error) throw error;
      return data as Booking[];
    } catch (error) {
      console.error('Error getting future bookings:', error);
      return [];
    }
  },

  getAll: async (): Promise<Booking[]> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('booking_date', { ascending: false });
        
      if (error) throw error;
      return data as Booking[];
    } catch (error) {
      console.error('Error getting all bookings:', error);
      return [];
    }
  },

  update: async (id: UUID, data: Partial<Booking>): Promise<Booking | undefined> => {
    try {
      const { data: updatedData, error } = await supabase
        .from('bookings')
        .update(data)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return updatedData as Booking;
    } catch (error) {
      console.error('Error updating booking:', error);
      return undefined;
    }
  },

  delete: async (id: UUID): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);
        
      return !error;
    } catch (error) {
      console.error('Error deleting booking:', error);
      return false;
    }
  }
}; 