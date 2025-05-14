import { supabase, isSupabaseConfigured } from '../supabase';
import { storage } from './storage';
import { User, Slot, SlotException, Booking, Payment, Invoice, Notification, UUID } from '@/types/schema';

// Helper to handle errors
function handleError(error: any, fallback: any = null) {
  console.error('Database error:', error);
  return fallback;
}

// User database operations
export const UserDatabase = {
  async getById(id: UUID): Promise<User | undefined> {
    if (!isSupabaseConfigured()) {
      return storage.users.get(id);
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as User;
    } catch (error) {
      return handleError(error);
    }
  },

  async getByEmail(email: string): Promise<User | undefined> {
    if (!isSupabaseConfigured()) {
      return Array.from(storage.users.values()).find(user => user.email === email);
    }

    try {
      console.log(`Looking for user with email: ${email}`);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);
      
      if (error) throw error;
      
      // Return the first matching user or undefined if no user found
      return data && data.length > 0 ? data[0] as User : undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  },

  async create(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    if (!isSupabaseConfigured()) {
      const id = crypto.randomUUID();
      const newUser: User = {
        ...user,
        id,
        created_at: new Date().toISOString()
      };
      storage.users.set(id, newUser);
      return newUser;
    }

    try {
      console.log('Creating user in Supabase:', user);
      
      // First insert the user with minimal required fields
      const { data, error } = await supabase
        .from('users')
        .insert([{ 
          name: user.name,
          email: user.email,
          phone: user.phone,
          dob: user.dob,
          is_admin: user.is_admin || false,
          is_verified: user.is_verified || false,
          otp_code: user.otp_code
        }])
        .select();
      
      if (error) {
        console.error('Failed to insert user:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('User created but no data returned');
        throw new Error('User created but no data returned');
      }
      
      const createdUser = data[0] as User;
      
      // Update with additional fields
      if (user.gender || user.swimming_experience || user.address) {
        const additionalFields: Record<string, any> = {};
        
        if (user.otp_expiry) additionalFields.otp_expiry = user.otp_expiry;
        if (user.gender) additionalFields.gender = user.gender;
        if (user.swimming_experience) additionalFields.swimming_experience = user.swimming_experience;
        if (user.address) additionalFields.address = user.address;
        if (user.city) additionalFields.city = user.city;
        if (user.state) additionalFields.state = user.state;
        if (user.zip_code) additionalFields.zip_code = user.zip_code;
        if (user.emergency_contact_name) additionalFields.emergency_contact_name = user.emergency_contact_name;
        if (user.emergency_contact_phone) additionalFields.emergency_contact_phone = user.emergency_contact_phone;
        
        const { error: updateError } = await supabase
          .from('users')
          .update(additionalFields)
          .eq('id', createdUser.id);
          
        if (updateError) {
          console.warn('Failed to update user with additional fields:', updateError);
          // Continue anyway as the basic user was created
        }
      }
      
      return createdUser;
    } catch (error) {
      console.error('Error creating user:', error);
      // Fallback to creating a user locally with an error ID
      const id = crypto.randomUUID();
      const newUser: User = {
        ...user,
        id,
        created_at: new Date().toISOString()
      };
      return newUser;
    }
  },

  async update(id: UUID, data: Partial<User>): Promise<User | undefined> {
    if (!isSupabaseConfigured()) {
      const user = storage.users.get(id);
      if (!user) return undefined;
      
      const updatedUser = { ...user, ...data };
      storage.users.set(id, updatedUser);
      return updatedUser;
    }

    try {
      const { data: updatedData, error } = await supabase
        .from('users')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedData as User;
    } catch (error) {
      return handleError(error);
    }
  },

  async delete(id: UUID): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured()) {
      const success = storage.users.delete(id);
      return { error: success ? null : new Error('User not found') };
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      return { error: error || null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  async getAll(): Promise<User[]> {
    if (!isSupabaseConfigured()) {
      return Array.from(storage.users.values());
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      return data as User[];
    } catch (error) {
      return handleError(error, []);
    }
  }
};

// More database operations for other entities like Slots, Bookings, etc. would follow the same pattern
// These can be implemented as needed for each entity 