import { User, UUID } from '@/types/schema';
import { storage, timestamp, generateId } from './storage';

export const UserService = {
  create: (user: Omit<User, 'id' | 'created_at'>): User => {
    const id = generateId();
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