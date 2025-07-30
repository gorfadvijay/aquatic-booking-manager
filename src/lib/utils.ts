import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Booking } from "@/types/schema"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Helper function to extract the first booking date from a booking object
 * Handles both legacy booking_date field and new booking_dates array
 */
export function getFirstBookingDate(booking: Booking): Date | null {
  // Try legacy booking_date field first
  if (booking.booking_date) {
    const date = new Date(booking.booking_date);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Try new booking_dates array
  if (booking.booking_dates) {
    try {
      const bookingDates = typeof booking.booking_dates === 'string' 
        ? JSON.parse(booking.booking_dates) 
        : booking.booking_dates;
      
      if (Array.isArray(bookingDates) && bookingDates.length > 0) {
        const date = new Date(bookingDates[0]);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    } catch (error) {
      console.error('Error parsing booking_dates:', error);
    }
  }
  
  // Fallback: try using created_at if available
  if (booking.created_at) {
    const date = new Date(booking.created_at);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  return null;
}

/**
 * Helper function to safely format a booking date
 * Returns a fallback string if date is invalid
 */
export function formatBookingDate(booking: Booking, formatStr: string, fallback: string = 'No Date'): string {
  const date = getFirstBookingDate(booking);
  if (!date) {
    return fallback;
  }
  
  try {
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return fallback;
  }
}

/**
 * Helper function to format booking dates as a readable range
 * For single day: "Aug 3, 2025"
 * For multiple days: "Aug 3-5, 2025" or "Aug 3 - Sep 5, 2025"
 */
export function formatBookingDatesRange(booking: Booking): string {
  // Try legacy booking_date field first
  if (booking.booking_date) {
    const date = new Date(booking.booking_date);
    if (!isNaN(date.getTime())) {
      return format(date, 'MMM d, yyyy');
    }
  }
  
  // Try new booking_dates array
  if (booking.booking_dates) {
    try {
      const bookingDates = typeof booking.booking_dates === 'string' 
        ? JSON.parse(booking.booking_dates) 
        : booking.booking_dates;
      
      if (Array.isArray(bookingDates) && bookingDates.length > 0) {
        if (bookingDates.length === 1) {
          // Single day
          const date = new Date(bookingDates[0]);
          return format(date, 'MMM d, yyyy');
        } else {
          // Multiple days - format as range
          const firstDate = new Date(bookingDates[0]);
          const lastDate = new Date(bookingDates[bookingDates.length - 1]);
          
          const firstMonth = format(firstDate, 'MMM');
          const lastMonth = format(lastDate, 'MMM');
          const year = format(lastDate, 'yyyy');
          
          if (firstMonth === lastMonth) {
            // Same month: "Aug 3-5, 2025"
            return `${firstMonth} ${format(firstDate, 'd')}-${format(lastDate, 'd')}, ${year}`;
          } else {
            // Different months: "Aug 3 - Sep 5, 2025"  
            return `${format(firstDate, 'MMM d')} - ${format(lastDate, 'MMM d')}, ${year}`;
          }
        }
      }
    } catch (error) {
      console.error('Error parsing booking_dates:', error, 'Raw value:', booking.booking_dates);
    }
  }
  
  // Fallback: try using created_at if available
  if (booking.created_at) {
    try {
      const date = new Date(booking.created_at);
      if (!isNaN(date.getTime())) {
        return format(date, 'MMM d, yyyy');
      }
    } catch (error) {
      console.error('Error parsing created_at:', error);
    }
  }
  
  // Final fallback: show today's date
  try {
    return format(new Date(), 'MMM d, yyyy') + ' (today)';
  } catch (error) {
    return 'No Date';
  }
}
