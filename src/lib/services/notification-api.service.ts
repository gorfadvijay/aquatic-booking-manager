import { Notification, UUID, NotificationChannel, NotificationType } from '@/types/schema';
import { NotificationService } from './index';

export const sendNotification = async (
  userId: UUID, 
  channel: NotificationChannel,
  type: NotificationType,
  message: string
): Promise<Notification> => {
  return NotificationService.create({
    user_id: userId,
    channel,
    type,
    message
  });
};

export const getUserNotifications = async (userId: UUID): Promise<Notification[]> => {
  return NotificationService.getByUserId(userId);
}; 