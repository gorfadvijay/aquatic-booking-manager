import { Notification, UUID } from '@/types/schema';
import { supabase } from '../supabase';

export const NotificationService = {
  create: async (notification: Omit<Notification, 'id' | 'sent_at' | 'status'>): Promise<Notification> => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{ 
          user_id: notification.user_id,
          channel: notification.channel,
          type: notification.type,
          message: notification.message,
          status: 'sent'
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data as Notification;
    } catch (error) {
      console.error('Failed to create notification in Supabase:', error);
      throw error;
    }
  },

  getById: async (id: UUID): Promise<Notification | undefined> => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Notification;
    } catch (error) {
      console.error('Failed to get notification from Supabase:', error);
      return undefined;
    }
  },

  getByUserId: async (userId: UUID): Promise<Notification[]> => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data as Notification[];
    } catch (error) {
      console.error('Failed to get notifications from Supabase:', error);
      return [];
    }
  },

  getAll: async (): Promise<Notification[]> => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*');
      
      if (error) throw error;
      return data as Notification[];
    } catch (error) {
      console.error('Failed to get all notifications from Supabase:', error);
      return [];
    }
  },

  update: async (id: UUID, data: Partial<Notification>): Promise<Notification | undefined> => {
    try {
      const { data: updatedData, error } = await supabase
        .from('notifications')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedData as Notification;
    } catch (error) {
      console.error('Failed to update notification in Supabase:', error);
      return undefined;
    }
  },

  delete: async (id: UUID): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      
      return !error;
    } catch (error) {
      console.error('Failed to delete notification from Supabase:', error);
      return false;
    }
  }
}; 