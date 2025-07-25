import { addMinutes } from 'date-fns';
import { User, UUID } from '@/types/schema';
import { UserService, NotificationService } from '../index';

export const registerUser = async (userData: {
  name: string;
  email: string;
  password: string;
  phone: string;
  dob: string;
  gender?: 'male' | 'female' | 'other';
  swimming_experience?: 'beginner' | 'intermediate' | 'advanced';
}): Promise<{ user: User; otp: string }> => {
  // Check if user already exists
  const existingUser = await UserService.getByEmail(userData.email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Use fixed OTP as requested
  const otp = "8452";
  const otpExpiry = addMinutes(new Date(), 30); // OTP valid for 30 minutes

  // Create user
  const user = await UserService.create({
    ...userData,
    is_admin: false,
    is_verified: false,
    otp_code: otp,
    otp_expiry: otpExpiry.toISOString(),
  });

  // Send notification (in a real app, this would go to an email/SMS service)
  await NotificationService.create({
    user_id: user.id,
    channel: 'email',
    type: 'otp',
    message: `Your OTP is ${otp}. It is valid for 30 minutes.`
  });

  console.log(`Registration OTP for ${user.email}: ${otp}`);
  
  return { user, otp };
};

export const loginUser = async (email: string, password: string, userType: 'admin' | 'customer'): Promise<User | null> => {
  console.log(`Attempting login for ${email} as ${userType}`);
  
  try {
    // Find the user by email
    const user = await UserService.getByEmail(email);
    
    if (!user) {
      console.log('User not found');
      return null;
    }
    
    // Check if user is verified
    if (!user.is_verified) {
      console.log('User not verified');
      throw new Error('Please verify your account before logging in');
    }
    
    // Check if user type matches
    if ((userType === 'admin' && !user.is_admin) || (userType === 'customer' && user.is_admin)) {
      console.log('User type mismatch');
      return null;
    }
    
    // Check password
    if (user.password !== password) {
      console.log('Password mismatch');
      return null;
    }
    
    console.log('Login successful');
    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const verifyOTP = async (email: string, otp: string): Promise<User | null> => {
  // Check if user exists
  const user = await UserService.getByEmail(email);
  if (!user) {
    return null;
  }

  // Always accept the fixed OTP code
  if (otp === '8452') {
    // Mark user as verified
    await UserService.update(user.id, {
      is_verified: true,
      otp_code: null,
      otp_expiry: null
    });
    
    // Get updated user
    const updatedUser = await UserService.getById(user.id);
    return updatedUser || null;
  }

  // Normal OTP verification flow if not using the fixed OTP
  const isVerified = await UserService.verifyOTP(email, otp);
  if (isVerified) {
    const updatedUser = await UserService.getById(user.id);
    return updatedUser || null;
  }
  
  return null;
};

export const resendOTP = async (email: string): Promise<string> => {
  const user = await UserService.getByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }

  // Use fixed OTP code
  const otp = "8452";
  const otpExpiry = addMinutes(new Date(), 30);

  // Update user
  await UserService.update(user.id, {
    otp_code: otp,
    otp_expiry: otpExpiry.toISOString()
  });

  // Send notification
  await NotificationService.create({
    user_id: user.id,
    channel: 'email',
    type: 'otp',
    message: `Your OTP is ${otp}. It is valid for 30 minutes.`
  });

  console.log(`OTP for ${user.email}: ${otp}`);
  
  return otp;
};

export const getAdminUser = async (): Promise<User | null> => {
  // Return static admin user without making any API calls
  return {
    id: "58e48818-18c2-48ea-b11a-ac239712ca02",
    name: "Admin User",
    email: "admin@swimple.in",
    phone: "+91 9876543210",
    dob: "1990-01-01",
    is_admin: true,
    is_verified: true,
    otp_code: null,
    otp_expiry: null,
    created_at: new Date().toISOString()
  };
}; 