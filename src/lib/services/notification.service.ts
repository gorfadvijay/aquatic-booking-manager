import { Notification, UUID } from '@/types/schema';
import { storage, timestamp, generateId } from './storage';

export const NotificationService = {
  create: (notification: Omit<Notification, 'id' | 'sent_at' | 'status'>): Notification => {
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

  getById: (id: UUID): Notification | undefined => {
    return storage.notifications.get(id);
  },

  getByUserId: (userId: UUID): Notification[] => {
    return Array.from(storage.notifications.values())
      .filter(notification => notification.user_id === userId);
  },

  getAll: (): Notification[] => {
    return Array.from(storage.notifications.values());
  },

  update: (id: UUID, data: Partial<Notification>): Notification | undefined => {
    const notification = storage.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, ...data };
    storage.notifications.set(id, updatedNotification);
    return updatedNotification;
  },

  delete: (id: UUID): boolean => {
    return storage.notifications.delete(id);
  }
}; 