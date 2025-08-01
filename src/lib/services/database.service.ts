import { supabase } from '../supabase';
import { User, UUID } from '@/types/schema';

// Helper to handle errors
function handleError(error: any, fallback: any = null) {
  console.error('Database error:', error);
  return fallback;
}

// User database operations
export const UserDatabase = {
  async getById(id: UUID): Promise<User | undefined> {
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
      if (user.gender || user.swimming_experience) {
        const additionalFields: Record<string, any> = {};
        
        if (user.otp_expiry) additionalFields.otp_expiry = user.otp_expiry;
        if (user.gender) additionalFields.gender = user.gender;
        if (user.swimming_experience) additionalFields.swimming_experience = user.swimming_experience;
        
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
      throw error;
    }
  },

  async update(id: UUID, data: Partial<User>): Promise<User | undefined> {
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