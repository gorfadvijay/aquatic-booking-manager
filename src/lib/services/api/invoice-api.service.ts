import { Invoice, UUID, NotificationChannel } from '@/types/schema';
import { InvoiceService, BookingService, UserService, NotificationService } from '../index';

export const generateInvoice = async (
  bookingId: UUID, 
  generatedBy: UUID,
  amount: number
): Promise<Invoice> => {
  // Check if booking exists
  const booking = BookingService.getById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  // Generate invoice number
  const invoiceNumber = InvoiceService.generateInvoiceNumber();
  
  // Create invoice
  const invoice = InvoiceService.create({
    booking_id: bookingId,
    invoice_number: invoiceNumber,
    generated_by: generatedBy,
    amount: amount,
    generated_at: new Date().toISOString(),
    sent_via_email: false,
    sent_via_whatsapp: false
  });
  
  return invoice;
};

export const sendInvoice = async (
  invoiceId: UUID, 
  channels: NotificationChannel[]
): Promise<Invoice | undefined> => {
  const invoice = InvoiceService.getById(invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  
  const booking = BookingService.getById(invoice.booking_id);
  if (!booking) {
    throw new Error('Associated booking not found');
  }
  
  const user = UserService.getById(booking.user_id);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Send notifications based on channels
  const updates: Partial<Invoice> = {};
  
  for (const channel of channels) {
    NotificationService.create({
      user_id: user.id,
      channel: channel,
      type: 'invoice',
      message: `Your invoice #${invoice.invoice_number} for the amount of ${invoice.amount} has been generated.`
    });
    
    if (channel === 'email') {
      updates.sent_via_email = true;
    } else if (channel === 'whatsapp') {
      updates.sent_via_whatsapp = true;
    }
  }
  
  // Update invoice with sent status
  return InvoiceService.update(invoiceId, updates);
};

export const getInvoiceByBookingId = async (bookingId: UUID): Promise<Invoice | undefined> => {
  return InvoiceService.getByBookingId(bookingId);
}; 