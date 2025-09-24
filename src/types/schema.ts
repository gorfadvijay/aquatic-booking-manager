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
  has_whatsapp?: boolean;
  age?: number | string;
  current_location?: string;
  academy_name?: string;
  coach_name?: string;
  specialization?: string;
  participate_in_events?: string;
  stroke_best_time?: string;
  how_did_you_know?: string;
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
  name: string;
  email: string;
  phone: string;
  slot_id: UUID;
  booking_dates: string; // JSON array of dates for multi-day bookings
  start_time: string; // Format: "HH:MM"
  end_time: string; // Format: "HH:MM"
  amount: number; // Payment amount in smallest currency unit
  payment_status: string;
  transaction_id?: string;
  payment_id?: string;
  payment_completed_at?: Date | string;
  phonepe_response?: any; // JSONB data
  user_data?: any; // JSONB complete user information
  created_at: Date | string;
  updated_at?: Date | string;
  // Legacy fields for compatibility
  booking_date?: Date | string;
  status?: BookingStatus;
  rescheduled_to?: UUID | null;
  cancel_reason?: string | null;
};

export type PaymentStatus = 'success' | 'failed' | 'refunded' | 'pending';

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

export type CampBooking = {
  id: UUID;
  name: string;
  email: string;
  phone_number: string | null;
  batch: string;
  camp: string;
  amount: number;
  payment_status: string;
  transaction_id: string | null;
  payment_id: string | null;
  phonepe_response: any | null;
  created_at: Date | string;
  updated_at: Date | string;
};

