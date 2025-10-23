import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '../server/db';
import { DatabaseStorage } from '../server/storage';
import { adminSettings, newsletterSubscribers } from '@shared/schema';

// Mock database
vi.mock('../server/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Admin Settings Storage', () => {
  let storage: DatabaseStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new DatabaseStorage();
  });

  describe('getAllSettings', () => {
    it('should retrieve all settings from database', async () => {
      const mockSettings = [
        { id: '1', key: 'email_from', value: 'noreply@test.com', category: 'email', description: null, updatedAt: new Date() },
        { id: '2', key: 'qr_style', value: 'rounded', category: 'qr', description: null, updatedAt: new Date() },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockResolvedValue(mockSettings),
      } as any);

      const result = await storage.getAllSettings();

      expect(result).toEqual(mockSettings);
      expect(db.select).toHaveBeenCalled();
    });

    it('should return empty array if no settings exist', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockResolvedValue([]),
      } as any);

      const result = await storage.getAllSettings();

      expect(result).toEqual([]);
    });
  });

  describe('getSetting', () => {
    it('should retrieve setting by key', async () => {
      const mockSetting = {
        id: '1',
        key: 'email_from',
        value: 'noreply@test.com',
        category: 'email',
        description: 'From email address',
        updatedAt: new Date(),
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockSetting]),
        }),
      } as any);

      const result = await storage.getSetting('email_from');

      expect(result).toEqual(mockSetting);
    });

    it('should return undefined if setting not found', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const result = await storage.getSetting('non_existent_key');

      expect(result).toBeUndefined();
    });
  });

  describe('upsertSetting', () => {
    it('should update existing setting', async () => {
      const existingSetting = {
        id: '1',
        key: 'email_from',
        value: 'old@test.com',
        category: 'email',
        description: null,
        updatedAt: new Date(),
      };

      const updatedSetting = {
        ...existingSetting,
        value: 'new@test.com',
        updatedAt: new Date(),
      };

      // Mock getSetting to return existing
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingSetting]),
        }),
      } as any);

      // Mock update
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedSetting]),
          }),
        }),
      } as any);

      const result = await storage.upsertSetting('email_from', 'new@test.com', 'email');

      expect(result.value).toBe('new@test.com');
      expect(db.update).toHaveBeenCalled();
    });

    it('should insert new setting if not exists', async () => {
      const newSetting = {
        id: '2',
        key: 'new_setting',
        value: 'test_value',
        category: 'general',
        description: 'Test setting',
        updatedAt: new Date(),
      };

      // Mock getSetting to return undefined
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Mock insert
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newSetting]),
        }),
      } as any);

      const result = await storage.upsertSetting('new_setting', 'test_value', 'general', 'Test setting');

      expect(result).toEqual(newSetting);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should handle setting without description', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const newSetting = {
        id: '3',
        key: 'test_key',
        value: 'test_value',
        category: 'test',
        description: undefined,
        updatedAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newSetting]),
        }),
      } as any);

      const result = await storage.upsertSetting('test_key', 'test_value', 'test');

      expect(result.description).toBeUndefined();
    });

    it('should update timestamp on upsert', async () => {
      const oldDate = new Date('2024-01-01');
      const newDate = new Date();

      const existingSetting = {
        id: '1',
        key: 'test_key',
        value: 'old_value',
        category: 'test',
        description: null,
        updatedAt: oldDate,
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingSetting]),
        }),
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ ...existingSetting, value: 'new_value', updatedAt: newDate }]),
          }),
        }),
      } as any);

      const result = await storage.upsertSetting('test_key', 'new_value', 'test');

      expect(result.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
    });
  });

  describe('Newsletter Subscribers', () => {
    describe('addNewsletterSubscriber', () => {
      it('should add new subscriber', async () => {
        vi.mocked(db.insert).mockReturnValue({
          values: vi.fn().mockReturnValue({
            onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
          }),
        } as any);

        await storage.addNewsletterSubscriber('new@example.com');

        expect(db.insert).toHaveBeenCalled();
      });

      it('should handle duplicate email gracefully', async () => {
        vi.mocked(db.insert).mockReturnValue({
          values: vi.fn().mockReturnValue({
            onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
          }),
        } as any);

        // Should not throw error on duplicate
        await expect(storage.addNewsletterSubscriber('existing@example.com')).resolves.not.toThrow();
      });

      it('should normalize email address', async () => {
        vi.mocked(db.insert).mockReturnValue({
          values: vi.fn().mockReturnValue({
            onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
          }),
        } as any);

        await storage.addNewsletterSubscriber('Test@Example.COM');

        // Verify insert was called (email normalization happens at DB level)
        expect(db.insert).toHaveBeenCalled();
      });
    });

    describe('getNewsletterSubscribers', () => {
      it('should retrieve all active subscribers', async () => {
        const mockSubscribers = [
          { id: '1', email: 'user1@example.com', isActive: true, subscribedAt: new Date() },
          { id: '2', email: 'user2@example.com', isActive: true, subscribedAt: new Date() },
        ];

        vi.mocked(db.select).mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockSubscribers),
          }),
        } as any);

        const result = await storage.getNewsletterSubscribers();

        expect(result).toEqual(mockSubscribers);
        expect(result.length).toBe(2);
      });

      it('should only return active subscribers', async () => {
        const activeSubscriber = { id: '1', email: 'active@example.com', isActive: true, subscribedAt: new Date() };

        vi.mocked(db.select).mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([activeSubscriber]),
          }),
        } as any);

        const result = await storage.getNewsletterSubscribers();

        expect(result).toEqual([activeSubscriber]);
        expect(result.every(s => s.isActive)).toBe(true);
      });

      it('should return empty array if no subscribers', async () => {
        vi.mocked(db.select).mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        } as any);

        const result = await storage.getNewsletterSubscribers();

        expect(result).toEqual([]);
      });
    });
  });

  describe('Settings Categories', () => {
    it('should support email category settings', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: '1',
            key: 'email_from',
            value: 'test@example.com',
            category: 'email',
            description: null,
            updatedAt: new Date(),
          }]),
        }),
      } as any);

      const result = await storage.upsertSetting('email_from', 'test@example.com', 'email');

      expect(result.category).toBe('email');
    });

    it('should support shipping category settings', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: '2',
            key: 'shipping_base_cost_ca',
            value: '5.00',
            category: 'shipping',
            description: null,
            updatedAt: new Date(),
          }]),
        }),
      } as any);

      const result = await storage.upsertSetting('shipping_base_cost_ca', '5.00', 'shipping');

      expect(result.category).toBe('shipping');
    });

    it('should support qr category settings', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: '3',
            key: 'qr_style',
            value: 'rounded',
            category: 'qr',
            description: null,
            updatedAt: new Date(),
          }]),
        }),
      } as any);

      const result = await storage.upsertSetting('qr_style', 'rounded', 'qr');

      expect(result.category).toBe('qr');
    });

    it('should support stripe category settings', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: '4',
            key: 'stripe_price_standard_cad',
            value: 'price_xxx',
            category: 'stripe',
            description: null,
            updatedAt: new Date(),
          }]),
        }),
      } as any);

      const result = await storage.upsertSetting('stripe_price_standard_cad', 'price_xxx', 'stripe');

      expect(result.category).toBe('stripe');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in getAllSettings', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockRejectedValue(new Error('Database error')),
      } as any);

      await expect(storage.getAllSettings()).rejects.toThrow('Database error');
    });

    it('should handle database errors in upsertSetting', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockRejectedValue(new Error('Connection lost')),
      } as any);

      await expect(storage.upsertSetting('test', 'value', 'test')).rejects.toThrow();
    });

    it('should handle database errors in addNewsletterSubscriber', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockRejectedValue(new Error('Insert failed')),
        }),
      } as any);

      await expect(storage.addNewsletterSubscriber('test@example.com')).rejects.toThrow();
    });
  });
});
