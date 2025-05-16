import { Invoice, UUID, NotificationChannel } from '@/types/schema';
import { InvoiceService } from '../invoice.service';
import { BookingService } from '../booking.service';
import { UserService, NotificationService } from '../index';
import { supabase } from '../../supabase';

export const generateInvoice = async (
  bookingId: UUID, 
  generatedBy: UUID,
  amount: number
): Promise<Invoice> => {
  try {
    // Check if booking exists
    const booking = await BookingService.getById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    // Check if invoice already exists for this booking
    const existingInvoice = await InvoiceService.getByBookingId(bookingId);
    if (existingInvoice) {
      return existingInvoice;
    }
    
    // Generate invoice number
    const invoiceNumber = InvoiceService.generateInvoiceNumber();
    
    // Create invoice
    const invoice = await InvoiceService.create({
      booking_id: bookingId,
      invoice_number: invoiceNumber,
      generated_by: generatedBy,
      amount: amount,
      generated_at: new Date().toISOString(),
      sent_via_email: false,
      sent_via_whatsapp: false
    });
    
    return invoice;
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw error;
  }
};

export const sendInvoice = async (
  invoiceId: UUID, 
  channels: NotificationChannel[]
): Promise<Invoice | undefined> => {
  try {
    const invoice = await InvoiceService.getById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    const booking = await BookingService.getById(invoice.booking_id);
    if (!booking) {
      throw new Error('Associated booking not found');
    }
    
    // Get user email from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', booking.user_id)
      .single();
      
    if (userError || !userData) {
      throw new Error('User not found');
    }
    
    // For now, we'll just update the invoice status since actual email sending 
    // would require additional setup
    const updates: Partial<Invoice> = {};
    
    for (const channel of channels) {
      if (channel === 'email') {
        updates.sent_via_email = true;
        // In a real app, you would send an actual email here
        console.log(`Would send email to ${userData.email} for invoice ${invoice.invoice_number}`);
      } else if (channel === 'whatsapp') {
        updates.sent_via_whatsapp = true;
        // In a real app, you would send a WhatsApp message here
        console.log(`Would send WhatsApp message for invoice ${invoice.invoice_number}`);
      }
    }
    
    // Update invoice with sent status
    return await InvoiceService.update(invoiceId, updates);
  } catch (error) {
    console.error("Error sending invoice:", error);
    return undefined;
  }
};

export const getInvoiceByBookingId = async (bookingId: UUID): Promise<Invoice | undefined> => {
  return await InvoiceService.getByBookingId(bookingId);
}; 