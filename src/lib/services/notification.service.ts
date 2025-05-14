import { Notification, UUID } from '@/types/schema';
import { storage, timestamp, generateId } from './storage';
import { isSupabaseConfigured } from '../supabase';
import { supabase } from '../supabase';

export const NotificationService = {
  create: async (notification: Omit<Notification, 'id' | 'sent_at' | 'status'>): Promise<Notification> => {
    if (isSupabaseConfigured()) {
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
        // Fall back to in-memory storage
      }
    }
    
    // In-memory storage
    const id = generateId();
    const newNotification: Notification = {
      ...notification,
      id,
      status: 'sent',
      sent_at: timestamp()
    };
    storage.notifications.set(id, newNotification);
    return newNotification;
  },

  getById: async (id: UUID): Promise<Notification | undefined> => {
    if (isSupabaseConfigured()) {
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
        // Fall back to in-memory storage
      }
    }
    
    return storage.notifications.get(id);
  },

  getByUserId: async (userId: UUID): Promise<Notification[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId);
        
        if (error) throw error;
        return data as Notification[];
      } catch (error) {
        console.error('Failed to get notifications from Supabase:', error);
        // Fall back to in-memory storage
      }
    }
    
    return Array.from(storage.notifications.values())
      .filter(notification => notification.user_id === userId);
  },

  getAll: async (): Promise<Notification[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*');
        
        if (error) throw error;
        return data as Notification[];
      } catch (error) {
        console.error('Failed to get all notifications from Supabase:', error);
        // Fall back to in-memory storage
      }
    }
    
    return Array.from(storage.notifications.values());
  },

  update: async (id: UUID, data: Partial<Notification>): Promise<Notification | undefined> => {
    if (isSupabaseConfigured()) {
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
        // Fall back to in-memory storage
      }
    }
    
    const notification = storage.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, ...data };
    storage.notifications.set(id, updatedNotification);
    return updatedNotification;
  },

  delete: async (id: UUID): Promise<boolean> => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', id);
        
        return !error;
      } catch (error) {
        console.error('Failed to delete notification from Supabase:', error);
        // Fall back to in-memory storage
      }
    }
    
    return storage.notifications.delete(id);
  }
}; 