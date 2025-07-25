import { CampBooking } from '@/types/schema';
import { supabase } from '../../supabase';

export const getAllCampBookings = async (): Promise<CampBooking[]> => {
  try {
    const { data, error } = await supabase
      .from('campbooking')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching camp bookings:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllCampBookings:', error);
    throw error;
  }
};

export const getCampBookingById = async (id: string): Promise<CampBooking | null> => {
  try {
    const { data, error } = await supabase
      .from('campbooking')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching camp booking by ID:', error);
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error in getCampBookingById:', error);
    throw error;
  }
};

export const getCampBookingsByStatus = async (status: string): Promise<CampBooking[]> => {
  try {
    const { data, error } = await supabase
      .from('campbooking')
      .select('*')
      .eq('payment_status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching camp bookings by status:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCampBookingsByStatus:', error);
    throw error;
  }
}; 