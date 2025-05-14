import { Slot, Booking, UUID } from '@/types/schema';
import { SlotService, BookingService } from '../index';
import { supabase } from '../../supabase';

export const createSlot = async (slotData: {
  start_date: Date | string;
  end_date?: Date | string;
  start_time: string;
  end_time: string;
  is_holiday: boolean;
  slot_duration: number;
}): Promise<Slot> => {
  try {
    const { data, error } = await supabase
      .from('slots')
      .insert([slotData])
      .select();
    
    if (error) {
      console.error('Failed to create slot:', error);
      throw error;
    }
    
    return data[0] as Slot;
  } catch (error) {
    console.error('Error creating slot:', error);
    throw error;
  }
};

export const updateSlot = async (
  id: UUID,
  slotData: Partial<Slot>
): Promise<{ slot: Slot; conflicts: Booking[] }> => {
  try {
    // In a real app, you would check for conflicts with existing bookings here
    const conflicts: Booking[] = [];
    
    // Update the slot in Supabase
    const { data, error } = await supabase
      .from('slots')
      .update(slotData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Failed to update slot:', error);
      throw error;
    }
    
    return { slot: data as Slot, conflicts };
  } catch (error) {
    console.error('Error updating slot:', error);
    throw new Error('Failed to update slot');
  }
};

export const getAllSlots = async (): Promise<Slot[]> => {
  try {
    const { data, error } = await supabase
      .from('slots')
      .select('*');
    
    if (error) {
      console.error('Failed to fetch slots:', error);
      throw error;
    }
    
    return data as Slot[];
  } catch (error) {
    console.error('Error getting all slots:', error);
    return [];
  }
};

export const getSlotById = async (id: UUID): Promise<Slot | undefined> => {
  try {
    const { data, error } = await supabase
      .from('slots')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Failed to fetch slot by ID:', error);
      return undefined;
    }
    
    return data as Slot;
  } catch (error) {
    console.error('Error getting slot by ID:', error);
    return undefined;
  }
};

export const getSlotsForDate = async (date: Date | string): Promise<Slot[]> => {
  try {
    // Convert date to ISO string format if it's a Date object
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('slots')
      .select('*')
      .eq('start_date', dateStr);
    
    if (error) {
      console.error('Failed to fetch slots for date:', error);
      throw error;
    }
    
    return data as Slot[];
  } catch (error) {
    console.error('Error getting slots for date:', error);
    return [];
  }
};

export const SlotApiService = {
  create: async (slot: Omit<Slot, 'id' | 'created_at'>): Promise<Slot> => {
    try {
      const { data, error } = await supabase
        .from('slots')
        .insert([slot])
        .select();
      
      if (error) {
        console.error('Failed to create slot:', error);
        throw error;
      }
      
      return data[0] as Slot;
    } catch (error) {
      console.error('Error creating slot:', error);
      throw error;
    }
  },

  getById: async (id: UUID): Promise<Slot | undefined> => {
    try {
      const { data, error } = await supabase
        .from('slots')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Slot;
    } catch (error) {
      console.error('Error getting slot by ID:', error);
      return undefined;
    }
  },

  getForDate: async (date: Date | string): Promise<Slot[]> => {
    try {
      // Convert date to ISO string format if it's a Date object
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('slots')
        .select('*')
        .eq('start_date', dateStr);
      
      if (error) throw error;
      return data as Slot[];
    } catch (error) {
      console.error('Error getting slots for date:', error);
      return [];
    }
  },

  getAll: async (): Promise<Slot[]> => {
    try {
      const { data, error } = await supabase
        .from('slots')
        .select('*');
      
      if (error) throw error;
      return data as Slot[];
    } catch (error) {
      console.error('Error getting all slots:', error);
      return [];
    }
  },

  update: async (id: UUID, data: Partial<Slot>): Promise<Slot | undefined> => {
    try {
      const { data: updatedData, error } = await supabase
        .from('slots')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedData as Slot;
    } catch (error) {
      console.error('Error updating slot:', error);
      return undefined;
    }
  },

  delete: async (id: UUID): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('slots')
        .delete()
        .eq('id', id);
      
      return !error;
    } catch (error) {
      console.error('Error deleting slot:', error);
      return false;
    }
  }
}; 