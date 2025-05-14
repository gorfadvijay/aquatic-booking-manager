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
  password?: string;
  gender?: 'male' | 'female' | 'other';
  swimming_experience?: 'beginner' | 'intermediate' | 'advanced';
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
};

export type Slot = {
  id: UUID;
  start_time: string; // Format: "HH:MM"
  end_time: string; // Format: "HH:MM"
  is_holiday: boolean;
  created_at: Date | string;
  start_date: Date | string;
  end_date?: Date | string;
  slot_duration: number;
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

