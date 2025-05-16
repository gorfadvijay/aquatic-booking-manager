import { Invoice, UUID } from '@/types/schema';
import { format } from 'date-fns';
import { supabase } from '../supabase';

export const InvoiceService = {
  create: async (invoice: Omit<Invoice, 'id'>): Promise<Invoice> => {
    try {
      console.log("InvoiceService: Attempting to create invoice:", invoice);
      
      // Verify the invoices table exists and we can access it
      const { count, error: countError } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error("InvoiceService: Error accessing invoices table:", countError);
        throw new Error(`Table access error: ${countError.message}`);
      }
      
      console.log("InvoiceService: Successfully accessed invoices table, count:", count);
      
      // Now attempt to insert the invoice
      const { data, error } = await supabase
        .from('invoices')
        .insert([invoice])
        .select()
        .single();
        
      if (error) {
        console.error("InvoiceService: Insert error details:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log("InvoiceService: Invoice created successfully:", data);
      return data as Invoice;
    } catch (error) {
      console.error('InvoiceService: Error creating invoice:', error);
      throw error;
    }
  },

  getById: async (id: UUID): Promise<Invoice | undefined> => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data as Invoice;
    } catch (error) {
      console.error('Error getting invoice by ID:', error);
      return undefined;
    }
  },

  getByBookingId: async (bookingId: UUID): Promise<Invoice | undefined> => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('booking_id', bookingId)
        .single();
        
      if (error) throw error;
      return data as Invoice;
    } catch (error) {
      console.error('Error getting invoice by booking ID:', error);
      return undefined;
    }
  },

  generateInvoiceNumber: (): string => {
    // Generate a random invoice number with prefix INV-
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    const datePart = format(new Date(), 'yyyyMMdd');
    return `INV-${datePart}-${randomPart}`;
  },

  getAll: async (): Promise<Invoice[]> => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('generated_at', { ascending: false });
        
      if (error) throw error;
      return data as Invoice[];
    } catch (error) {
      console.error('Error getting all invoices:', error);
      return [];
    }
  },

  update: async (id: UUID, data: Partial<Invoice>): Promise<Invoice | undefined> => {
    try {
      const { data: updatedData, error } = await supabase
        .from('invoices')
        .update(data)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return updatedData as Invoice;
    } catch (error) {
      console.error('Error updating invoice:', error);
      return undefined;
    }
  },

  delete: async (id: UUID): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
        
      return !error;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  }
}; 