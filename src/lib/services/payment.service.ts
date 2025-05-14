import { Payment, UUID } from '@/types/schema';
import { storage, generateId } from './storage';

export const PaymentService = {
  create: (payment: Omit<Payment, 'id'>): Payment => {
    const id = generateId();
    const newPayment: Payment = {
      ...payment,
      id
    };
    storage.payments.set(id, newPayment);
    return newPayment;
  },

  getById: (id: UUID): Payment | undefined => {
    return storage.payments.get(id);
  },

  getByBookingId: (bookingId: UUID): Payment | undefined => {
    return Array.from(storage.payments.values())
      .find(payment => payment.booking_id === bookingId);
  },

  getAll: (): Payment[] => {
    return Array.from(storage.payments.values());
  },

  update: (id: UUID, data: Partial<Payment>): Payment | undefined => {
    const payment = storage.payments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { ...payment, ...data };
    storage.payments.set(id, updatedPayment);
    return updatedPayment;
  },

  refund: (id: UUID): Payment | undefined => {
    const payment = storage.payments.get(id);
    if (!payment) return undefined;
    
    const refundedPayment = { ...payment, status: 'refunded' as const };
    storage.payments.set(id, refundedPayment);
    return refundedPayment;
  },

  delete: (id: UUID): boolean => {
    return storage.payments.delete(id);
  }
}; 