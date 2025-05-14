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
export const storage = {
  users: new Map<UUID, User>(),
  slots: new Map<UUID, Slot>(),
  slotExceptions: new Map<UUID, SlotException>(),
  bookings: new Map<UUID, Booking>(),
  payments: new Map<UUID, Payment>(),
  invoices: new Map<UUID, Invoice>(),
  notifications: new Map<UUID, Notification>(),
};

// Helper function to create timestamps
export const timestamp = () => new Date().toISOString();

// Helper function to generate UUIDs
export const generateId = () => uuidv4(); 