import { User, UUID } from '@/types/schema';
import { storage, timestamp, generateId } from './storage';
import { UserDatabase } from './database.service';
import { isSupabaseConfigured } from '../supabase';

export const UserService = {
  create: async (user: Omit<User, 'id' | 'created_at'>): Promise<User> => {
    if (isSupabaseConfigured()) {
      return UserDatabase.create(user);
    }
    
    // Fallback to in-memory storage
    const id = generateId();
    const newUser: User = {
      ...user,
      id,
      created_at: timestamp()
    };
    storage.users.set(id, newUser);
    return newUser;
  },

  getById: async (id: UUID): Promise<User | undefined> => {
    if (isSupabaseConfigured()) {
      return UserDatabase.getById(id);
    }
    
    // Fallback to in-memory storage
    return storage.users.get(id);
  },

  getByEmail: async (email: string): Promise<User | undefined> => {
    if (isSupabaseConfigured()) {
      return UserDatabase.getByEmail(email);
    }
    
    // Fallback to in-memory storage
    return Array.from(storage.users.values()).find(user => user.email === email);
  },

  update: async (id: UUID, data: Partial<User>): Promise<User | undefined> => {
    if (isSupabaseConfigured()) {
      return UserDatabase.update(id, data);
    }
    
    // Fallback to in-memory storage
    const user = storage.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    storage.users.set(id, updatedUser);
    return updatedUser;
  },

  delete: async (id: UUID): Promise<boolean> => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await UserDatabase.delete(id);
        return !error;
      } catch {
        return false;
      }
    }
    
    // Fallback to in-memory storage
    return storage.users.delete(id);
  },

  verifyOTP: async (email: string, otp: string): Promise<boolean> => {
    const user = await UserService.getByEmail(email);
    
    if (!user || !user.otp_code || user.otp_code !== otp) {
      return false;
    }
    
    // Check if OTP is expired
    if (user.otp_expiry && new Date() > new Date(user.otp_expiry)) {
      return false;
    }
    
    // Mark user as verified and clear OTP
    await UserService.update(user.id, {
      is_verified: true,
      otp_code: null,
      otp_expiry: null
    });
    
    return true;
  },
  
  getAll: async (): Promise<User[]> => {
    if (isSupabaseConfigured()) {
      return UserDatabase.getAll();
    }
    
    // Fallback to in-memory storage
    return Array.from(storage.users.values());
  }
}; 