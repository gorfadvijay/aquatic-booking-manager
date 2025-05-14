import { SlotException, UUID } from '@/types/schema';
import { SlotExceptionService } from '../index';
import { supabase } from '../../supabase';

export const createSlotExceptionApi = async (
  exceptionData: Omit<SlotException, 'id'>
): Promise<SlotException> => {
  try {
    const { data, error } = await supabase
      .from('slot_exceptions')
      .insert([exceptionData])
      .select();
    
    if (error) {
      console.error('Failed to create slot exception:', error);
      throw error;
    }
    
    return data[0] as SlotException;
  } catch (error) {
    console.error('Error creating slot exception:', error);
    throw error;
  }
};

export const getSlotExceptions = async (): Promise<SlotException[]> => {
  try {
    const { data, error } = await supabase
      .from('slot_exceptions')
      .select('*');
    
    if (error) {
      console.error('Failed to fetch slot exceptions:', error);
      throw error;
    }
    
    return data as SlotException[];
  } catch (error) {
    console.error('Error fetching slot exceptions:', error);
    return [];
  }
}; 