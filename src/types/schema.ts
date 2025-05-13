

/**
 * Database schema type definitions for the Swim Slot Booking System
 */

export type UUID = string;

export type User = {
  id: UUID;
  name: string;
  email: string;
  phone: string;
  dob: Date | string;
  is_admin: boolean;
  is_verified: boolean;
  otp_code: string | null;
  otp_expiry: Date | string | null;
  created_at: Date | string;
};

export type Slot = {
  id: UUID;
  day_of_week: string;
  start_time: string; // Format: "HH:MM"
  end_time: string; // Format: "HH:MM"
  is_holiday: boolean;
  created_by: UUID;
  created_at: Date | string;
};

export type SlotException = {
  id: UUID;
  slot_id: UUID;
  date: Date | string;
  new_start_time: string | null; // Format: "HH:MM"
  new_end_time: string | null; // Format: "HH:MM"
  is_holiday: boolean;
  notes: string;
};

export type BookingStatus = 'booked' | 'cancelled' | 'completed' | 'rescheduled';

export type Booking = {
  id: UUID;
  user_id: UUID;
  slot_id: UUID;
  booking_date: Date | string;
  start_time: string; // Format: "HH:MM"
  end_time: string; // Format: "HH:MM"
  status: BookingStatus;
  rescheduled_to: UUID | null;
  cancel_reason: string | null;
  created_at: Date | string;
};

export type PaymentStatus = 'success' | 'failed' | 'refunded';

export type Payment = {
  id: UUID;
  booking_id: UUID;
  payment_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string;
  paid_at: Date | string;
};

export type Invoice = {
  id: UUID;
  booking_id: UUID;
  invoice_number: string;
  generated_by: UUID;
  amount: number;
  generated_at: Date | string;
  sent_via_email: boolean;
  sent_via_whatsapp: boolean;
};

export type NotificationChannel = 'email' | 'sms' | 'whatsapp';
export type NotificationType = 'otp' | 'confirmation' | 'reminder' | 'invoice' | 'refund';
export type NotificationStatus = 'sent' | 'failed';

export type Notification = {
  id: UUID;
  user_id: UUID;
  channel: NotificationChannel;
  type: NotificationType;
  message: string;
  status?: NotificationStatus;
  sent_at?: Date | string;
};

