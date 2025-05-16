import { Slot, UUID } from '@/types/schema';
import { supabase } from '../supabase';

export const SlotService = {
  create: async (slot: Omit<Slot, 'id' | 'created_at'>): Promise<Slot> => {
    try {
      const { data, error } = await supabase
        .from('slots')
        .insert([slot])
        .select()
        .single();
        
      if (error) throw error;
      return data as Slot;
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

  getByDayOfWeek: async (day: string): Promise<Slot | undefined> => {
    try {
      const { data, error } = await supabase
        .from('slots')
        .select('*')
        .eq('day_of_week', day)
        .single();
        
      if (error) throw error;
      return data as Slot;
    } catch (error) {
      console.error('Error getting slot by day:', error);
      return undefined;
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