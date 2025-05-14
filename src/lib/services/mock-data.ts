import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { storage, timestamp } from './storage';

// Initialize mock data
export function initializeMockData() {
  // Create admin user
  const adminId = uuidv4();
  storage.users.set(adminId, {
    id: adminId,
    name: 'Admin User',
    email: 'admin@swimple.com',
    phone: '+91 9876543210',
    dob: '1990-01-01',
    is_admin: true,
    is_verified: true,
    otp_code: null,
    otp_expiry: null,
    created_at: timestamp()
  });

  // Create sample slots for each day of the week
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  days.forEach(day => {
    const slotId = uuidv4();
    const isWeekend = day === 'Saturday' || day === 'Sunday';
    
    storage.slots.set(slotId, {
      id: slotId,
      day_of_week: day,
      start_time: isWeekend ? '' : '09:00',
      end_time: isWeekend ? '' : '17:00',
      is_holiday: isWeekend,
      created_by: adminId,
      created_at: timestamp()
    });
  });

  // Create sample users
  const userId = uuidv4();
  storage.users.set(userId, {
    id: userId,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91 9876543211',
    dob: '1995-05-15',
    is_admin: false,
    is_verified: true,
    otp_code: null,
    otp_expiry: null,
    created_at: timestamp()
  });

  // Create sample bookings
  const regularSlots = Array.from(storage.slots.values())
    .filter(slot => !slot.is_holiday);
  
  if (regularSlots.length > 0) {
    const slotId = regularSlots[0].id;
    const bookingId = uuidv4();
    
    // Create a booking for today
    const today = new Date();
    const formattedDate = format(today, 'yyyy-MM-dd');
    
    storage.bookings.set(bookingId, {
      id: bookingId,
      user_id: userId,
      slot_id: slotId,
      booking_date: formattedDate,
      start_time: '10:00',
      end_time: '11:00',
      status: 'booked',
      rescheduled_to: null,
      cancel_reason: null,
      created_at: timestamp()
    });

    // Create payment for the booking
    const paymentId = uuidv4();
    storage.payments.set(paymentId, {
      id: paymentId,
      booking_id: bookingId,
      payment_id: `pay_${Math.random().toString(36).substring(2, 10)}`,
      amount: 1500,
      currency: 'INR',
      status: 'success',
      payment_method: 'card',
      paid_at: timestamp()
    });
  }

  console.log('Mock database initialized with sample data.');
}

// Export storage for direct access in development
export { storage }; 