import { addMinutes } from 'date-fns';
import { User, UUID } from '@/types/schema';
import { UserService, NotificationService } from './index';

export const registerUser = async (userData: {
  name: string;
  email: string;
  phone: string;
  dob: string;
}): Promise<{ user: User; otp: string }> => {
  // Check if user already exists
  const existingUser = UserService.getByEmail(userData.email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = addMinutes(new Date(), 10); // OTP valid for 10 minutes

  // Create user
  const user = UserService.create({
    ...userData,
    is_admin: false,
    is_verified: false,
    otp_code: otp,
    otp_expiry: otpExpiry.toISOString(),
  });

  // Send notification (in a real app, this would go to an email/SMS service)
  NotificationService.create({
    user_id: user.id,
    channel: 'email',
    type: 'otp',
    message: `Your OTP is ${otp}. It is valid for 10 minutes.`
  });

  console.log(`Registration OTP for ${user.email}: ${otp}`);
  
  return { user, otp };
};

export const verifyOTP = async (email: string, otp: string): Promise<User | null> => {
  // Accept the fixed development OTP for testing
  if (otp === '8452') {
    const user = UserService.getByEmail(email);
    if (user) {
      // Mark user as verified
      UserService.update(user.id, {
        is_verified: true,
        otp_code: null,
        otp_expiry: null
      });
      return user;
    }
  }

  // Normal OTP verification flow
  const isVerified = UserService.verifyOTP(email, otp);
  if (isVerified) {
    const user = UserService.getByEmail(email);
    return user || null;
  }
  return null;
};

export const resendOTP = async (email: string): Promise<string> => {
  const user = UserService.getByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }

  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = addMinutes(new Date(), 10);

  // Update user
  UserService.update(user.id, {
    otp_code: otp,
    otp_expiry: otpExpiry.toISOString()
  });

  // Send notification
  NotificationService.create({
    user_id: user.id,
    channel: 'email',
    type: 'otp',
    message: `Your new OTP is ${otp}. It is valid for 10 minutes.`
  });

  console.log(`New OTP for ${user.email}: ${otp}`);
  
  return otp;
}; 