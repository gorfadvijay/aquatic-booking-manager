import { SlotException, UUID } from '@/types/schema';
import { storage, generateId } from './storage';

export const SlotExceptionService = {
  create: (exception: Omit<SlotException, 'id'>): SlotException => {
    const id = generateId();
    const newException: SlotException = {
      ...exception,
      id
    };
    storage.slotExceptions.set(id, newException);
    return newException;
  },

  getById: (id: UUID): SlotException | undefined => {
    return storage.slotExceptions.get(id);
  },

  getBySlotAndDate: (slotId: UUID, date: string): SlotException | undefined => {
    return Array.from(storage.slotExceptions.values())
      .find(ex => ex.slot_id === slotId && ex.date === date);
  },

  getAll: (): SlotException[] => {
    return Array.from(storage.slotExceptions.values());
  },

  update: (id: UUID, data: Partial<SlotException>): SlotException | undefined => {
    const exception = storage.slotExceptions.get(id);
    if (!exception) return undefined;
    
    const updatedException = { ...exception, ...data };
    storage.slotExceptions.set(id, updatedException);
    return updatedException;
  },

  delete: (id: UUID): boolean => {
    return storage.slotExceptions.delete(id);
  }
}; 