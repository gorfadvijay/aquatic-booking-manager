import { Slot, SlotException, Booking, UUID } from '@/types/schema';
import { SlotService, SlotExceptionService, BookingService } from './index';

export const createSlot = async (slotData: {
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_holiday: boolean;
  created_by: UUID;
}): Promise<Slot> => {
  return SlotService.create(slotData);
};

export const updateSlot = async (
  id: UUID,
  data: Partial<Slot>
): Promise<{ slot: Slot; conflicts: Booking[] }> => {
  // Check for conflicts with existing bookings
  const conflicts = BookingService.getActiveBookingsForSlot(id);
  
  // Update the slot
  const slot = SlotService.update(id, data);
  if (!slot) {
    throw new Error('Slot not found');
  }
  
  return { slot, conflicts };
};

export const createSlotException = async (
  exceptionData: Omit<SlotException, 'id'>
): Promise<SlotException> => {
  return SlotExceptionService.create(exceptionData);
};

export const getAllSlots = async (): Promise<Slot[]> => {
  return SlotService.getAll();
};

export const getSlotById = async (id: UUID): Promise<Slot | undefined> => {
  return SlotService.getById(id);
}; 