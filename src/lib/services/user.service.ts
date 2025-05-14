import { User, UUID } from '@/types/schema';
import { supabase } from '../supabase';

export const UserService = {
  create: async (user: Omit<User, 'id' | 'created_at'>): Promise<User> => {
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
          password: user.password,
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
      throw error;
    }
  },

  getById: async (id: UUID): Promise<User | undefined> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as User;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return undefined;
    }
  },

  getByEmail: async (email: string): Promise<User | undefined> => {
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

  update: async (id: UUID, data: Partial<User>): Promise<User | undefined> => {
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
      console.error('Error updating user:', error);
      return undefined;
    }
  },

  delete: async (id: UUID): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      return !error;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
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
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      return data as User[];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }
}; 