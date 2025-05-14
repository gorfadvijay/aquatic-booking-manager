import { Invoice, UUID } from '@/types/schema';
import { storage, generateId } from './storage';
import { format } from 'date-fns';

export const InvoiceService = {
  create: (invoice: Omit<Invoice, 'id'>): Invoice => {
    const id = generateId();
    const newInvoice: Invoice = {
      ...invoice,
      id
    };
    storage.invoices.set(id, newInvoice);
    return newInvoice;
  },

  getById: (id: UUID): Invoice | undefined => {
    return storage.invoices.get(id);
  },

  getByBookingId: (bookingId: UUID): Invoice | undefined => {
    return Array.from(storage.invoices.values())
      .find(invoice => invoice.booking_id === bookingId);
  },

  generateInvoiceNumber: (): string => {
    // Generate a random invoice number with prefix INV-
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    const datePart = format(new Date(), 'yyyyMMdd');
    return `INV-${datePart}-${randomPart}`;
  },

  getAll: (): Invoice[] => {
    return Array.from(storage.invoices.values());
  },

  update: (id: UUID, data: Partial<Invoice>): Invoice | undefined => {
    const invoice = storage.invoices.get(id);
    if (!invoice) return undefined;
    
    const updatedInvoice = { ...invoice, ...data };
    storage.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  },

  delete: (id: UUID): boolean => {
    return storage.invoices.delete(id);
  }
}; 