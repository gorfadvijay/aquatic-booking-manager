
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { 
  User, 
  Slot, 
  SlotException, 
  Booking, 
  Payment, 
  Invoice, 
  Notification,
  UUID
} from '@/types/schema';

// Mock storage
const storage = {
  users: new Map<UUID, User>(),
  slots: new Map<UUID, Slot>(),
  slotExceptions: new Map<UUID, SlotException>(),
  bookings: new Map<UUID, Booking>(),
  payments: new Map<UUID, Payment>(),
  invoices: new Map<UUID, Invoice>(),
  notifications: new Map<UUID, Notification>(),
};

// Helper function to create timestamps
const timestamp = () => new Date().toISOString();

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

// CRUD functions for Users
export const UserService = {
  create: (user: Omit<User, 'id' | 'created_at'>): User => {
    const id = uuidv4();
    const newUser: User = {
      ...user,
      id,
      created_at: timestamp()
    };
    storage.users.set(id, newUser);
    return newUser;
  },

  getById: (id: UUID): User | undefined => {
    return storage.users.get(id);
  },

  getByEmail: (email: string): User | undefined => {
    return Array.from(storage.users.values()).find(user => user.email === email);
  },

  update: (id: UUID, data: Partial<User>): User | undefined => {
    const user = storage.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    storage.users.set(id, updatedUser);
    return updatedUser;
  },

  delete: (id: UUID): boolean => {
    return storage.users.delete(id);
  },

  verifyOTP: (email: string, otp: string): boolean => {
    const user = Array.from(storage.users.values()).find(user => user.email === email);
    
    if (!user || !user.otp_code || user.otp_code !== otp) {
      return false;
    }
    
    // Check if OTP is expired
    if (user.otp_expiry && new Date() > new Date(user.otp_expiry)) {
      return false;
    }
    
    // Mark user as verified and clear OTP
    storage.users.set(user.id, {
      ...user,
      is_verified: true,
      otp_code: null,
      otp_expiry: null
    });
    
    return true;
  },
  
  getAll: (): User[] => {
    return Array.from(storage.users.values());
  }
};

// CRUD functions for Slots
export const SlotService = {
  create: (slot: Omit<Slot, 'id' | 'created_at'>): Slot => {
    const id = uuidv4();
    const newSlot: Slot = {
      ...slot,
      id,
      created_at: timestamp()
    };
    storage.slots.set(id, newSlot);
    return newSlot;
  },

  getById: (id: UUID): Slot | undefined => {
    return storage.slots.get(id);
  },

  getByDayOfWeek: (day: string): Slot | undefined => {
    return Array.from(storage.slots.values()).find(slot => slot.day_of_week === day);
  },

  getAll: (): Slot[] => {
    return Array.from(storage.slots.values());
  },

  update: (id: UUID, data: Partial<Slot>): Slot | undefined => {
    const slot = storage.slots.get(id);
    if (!slot) return undefined;
    
    const updatedSlot = { ...slot, ...data };
    storage.slots.set(id, updatedSlot);
    return updatedSlot;
  },

  delete: (id: UUID): boolean => {
    return storage.slots.delete(id);
  }
};

// CRUD functions for SlotExceptions
export const SlotExceptionService = {
  create: (exception: Omit<SlotException, 'id'>): SlotException => {
    const id = uuidv4();
    const newException: SlotException = {
      ...exception,
      id
    };
    storage.slotExceptions.set(id, newException);
    return newException;
  },

  getById: (id: UUID): SlotException | undefined => {
    return storage.slotExceptions.get(id);
  },

  getBySlotAndDate: (slotId: UUID, date: string): SlotException | undefined => {
    return Array.from(storage.slotExceptions.values())
      .find(ex => ex.slot_id === slotId && ex.date === date);
  },

  getAll: (): SlotException[] => {
    return Array.from(storage.slotExceptions.values());
  },

  update: (id: UUID, data: Partial<SlotException>): SlotException | undefined => {
    const exception = storage.slotExceptions.get(id);
    if (!exception) return undefined;
    
    const updatedException = { ...exception, ...data };
    storage.slotExceptions.set(id, updatedException);
    return updatedException;
  },

  delete: (id: UUID): boolean => {
    return storage.slotExceptions.delete(id);
  }
};

// CRUD functions for Bookings
export const BookingService = {
  create: (booking: Omit<Booking, 'id' | 'created_at'>): Booking => {
    const id = uuidv4();
    const newBooking: Booking = {
      ...booking,
      id,
      created_at: timestamp()
    };
    storage.bookings.set(id, newBooking);
    return newBooking;
  },

  getById: (id: UUID): Booking | undefined => {
    return storage.bookings.get(id);
  },
  
  getByUserId: (userId: UUID): Booking[] => {
    return Array.from(storage.bookings.values())
      .filter(booking => booking.user_id === userId);
  },
  
  getByDate: (date: string): Booking[] => {
    return Array.from(storage.bookings.values())
      .filter(booking => booking.booking_date === date);
  },
  
  getBySlotId: (slotId: UUID): Booking[] => {
    return Array.from(storage.bookings.values())
      .filter(booking => booking.slot_id === slotId);
  },
  
  getActiveBookingsForSlot: (slotId: UUID): Booking[] => {
    // Get bookings that are not cancelled or completed
    return Array.from(storage.bookings.values())
      .filter(booking => 
        booking.slot_id === slotId && 
        (booking.status === 'booked' || booking.status === 'rescheduled') &&
        new Date(booking.booking_date) >= new Date() // Future date
      );
  },

  getAllFuture: (): Booking[] => {
    const now = new Date();
    return Array.from(storage.bookings.values())
      .filter(booking => new Date(booking.booking_date) >= now);
  },
  
  getAll: (): Booking[] => {
    return Array.from(storage.bookings.values());
  },
  
  update: (id: UUID, data: Partial<Booking>): Booking | undefined => {
    const booking = storage.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking = { ...booking, ...data };
    storage.bookings.set(id, updatedBooking);
    return updatedBooking;
  },
  
  cancel: (id: UUID, reason: string): Booking | undefined => {
    const booking = storage.bookings.get(id);
    if (!booking) return undefined;
    
    const cancelledBooking = { 
      ...booking, 
      status: 'cancelled' as const,
      cancel_reason: reason 
    };
    storage.bookings.set(id, cancelledBooking);
    return cancelledBooking;
  },
  
  reschedule: (id: UUID, newBookingId: UUID): Booking | undefined => {
    const booking = storage.bookings.get(id);
    if (!booking) return undefined;
    
    const rescheduledBooking = { 
      ...booking, 
      status: 'rescheduled' as const,
      rescheduled_to: newBookingId 
    };
    storage.bookings.set(id, rescheduledBooking);
    return rescheduledBooking;
  },

  delete: (id: UUID): boolean => {
    return storage.bookings.delete(id);
  }
};

// CRUD functions for Payments
export const PaymentService = {
  create: (payment: Omit<Payment, 'id'>): Payment => {
    const id = uuidv4();
    const newPayment: Payment = {
      ...payment,
      id
    };
    storage.payments.set(id, newPayment);
    return newPayment;
  },

  getById: (id: UUID): Payment | undefined => {
    return storage.payments.get(id);
  },

  getByBookingId: (bookingId: UUID): Payment | undefined => {
    return Array.from(storage.payments.values())
      .find(payment => payment.booking_id === bookingId);
  },

  getAll: (): Payment[] => {
    return Array.from(storage.payments.values());
  },

  update: (id: UUID, data: Partial<Payment>): Payment | undefined => {
    const payment = storage.payments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { ...payment, ...data };
    storage.payments.set(id, updatedPayment);
    return updatedPayment;
  },

  refund: (id: UUID): Payment | undefined => {
    const payment = storage.payments.get(id);
    if (!payment) return undefined;
    
    const refundedPayment = { ...payment, status: 'refunded' as const };
    storage.payments.set(id, refundedPayment);
    return refundedPayment;
  },

  delete: (id: UUID): boolean => {
    return storage.payments.delete(id);
  }
};

// CRUD functions for Invoices
export const InvoiceService = {
  create: (invoice: Omit<Invoice, 'id'>): Invoice => {
    const id = uuidv4();
    const newInvoice: Invoice = {
      ...invoice,
      id
    };
    storage.invoices.set(id, newInvoice);
    return newInvoice;
  },

  getById: (id: UUID): Invoice | undefined => {
    return storage.invoices.get(id);
  },

  getByBookingId: (bookingId: UUID): Invoice | undefined => {
    return Array.from(storage.invoices.values())
      .find(invoice => invoice.booking_id === bookingId);
  },

  generateInvoiceNumber: (): string => {
    // Generate a random invoice number with prefix INV-
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    const datePart = format(new Date(), 'yyyyMMdd');
    return `INV-${datePart}-${randomPart}`;
  },

  getAll: (): Invoice[] => {
    return Array.from(storage.invoices.values());
  },

  update: (id: UUID, data: Partial<Invoice>): Invoice | undefined => {
    const invoice = storage.invoices.get(id);
    if (!invoice) return undefined;
    
    const updatedInvoice = { ...invoice, ...data };
    storage.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  },

  delete: (id: UUID): boolean => {
    return storage.invoices.delete(id);
  }
};

// CRUD functions for Notifications
export const NotificationService = {
  create: (notification: Omit<Notification, 'id' | 'sent_at' | 'status'>): Notification => {
    const id = uuidv4();
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

// Helper service for reports
export const ReportService = {
  getBookingsByDate: (startDate: Date, endDate: Date) => {
    return Array.from(storage.bookings.values()).filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return bookingDate >= startDate && bookingDate <= endDate;
    });
  },
  
  getBookingsByStatus: (status: BookingStatus) => {
    return Array.from(storage.bookings.values()).filter(booking => booking.status === status);
  },
  
  getPaymentsByDate: (startDate: Date, endDate: Date) => {
    return Array.from(storage.payments.values()).filter(payment => {
      const paymentDate = new Date(payment.paid_at);
      return paymentDate >= startDate && paymentDate <= endDate;
    });
  },
  
  getInvoicesByDate: (startDate: Date, endDate: Date) => {
    return Array.from(storage.invoices.values()).filter(invoice => {
      const invoiceDate = new Date(invoice.generated_at);
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });
  },
  
  // Revenue summary
  calculateRevenueSummary: (startDate: Date, endDate: Date) => {
    const payments = ReportService.getPaymentsByDate(startDate, endDate);
    
    const totalRevenue = payments
      .filter(p => p.status === 'success')
      .reduce((sum, payment) => sum + payment.amount, 0);
      
    const totalRefunded = payments
      .filter(p => p.status === 'refunded')
      .reduce((sum, payment) => sum + payment.amount, 0);
      
    return {
      totalRevenue,
      totalRefunded,
      netRevenue: totalRevenue - totalRefunded,
      successfulPayments: payments.filter(p => p.status === 'success').length,
      failedPayments: payments.filter(p => p.status === 'failed').length,
      refundedPayments: payments.filter(p => p.status === 'refunded').length
    };
  },
  
  // Booking summary
  calculateBookingSummary: (startDate: Date, endDate: Date) => {
    const bookings = ReportService.getBookingsByDate(startDate, endDate);
    
    return {
      totalBookings: bookings.length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      rescheduledBookings: bookings.filter(b => b.status === 'rescheduled').length,
      activeBookings: bookings.filter(b => b.status === 'booked').length,
    };
  }
};

// Initialize mock data
initializeMockData();

// Export storage for direct access in development
export { storage };
