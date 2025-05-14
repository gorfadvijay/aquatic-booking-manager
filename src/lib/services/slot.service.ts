import { Slot, UUID } from '@/types/schema';
import { storage, timestamp, generateId } from './storage';

export const SlotService = {
  create: (slot: Omit<Slot, 'id' | 'created_at'>): Slot => {
    const id = generateId();
    const newSlot: Slot = {
      ...slot,
      id,
      created_at: timestamp()
    };
    storage.slots.set(id, newSlot);
    return newSlot;
  },

  getById: (id: UUID): Slot | undefined => {
    return storage.slots.get(id);
  },

  getByDayOfWeek: (day: string): Slot | undefined => {
    return Array.from(storage.slots.values()).find(slot => slot.day_of_week === day);
  },

  getAll: (): Slot[] => {
    return Array.from(storage.slots.values());
  },

  update: (id: UUID, data: Partial<Slot>): Slot | undefined => {
    const slot = storage.slots.get(id);
    if (!slot) return undefined;
    
    const updatedSlot = { ...slot, ...data };
    storage.slots.set(id, updatedSlot);
    return updatedSlot;
  },

  delete: (id: UUID): boolean => {
    return storage.slots.delete(id);
  }
}; 