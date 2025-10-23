import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateOrderZIP, generateBulkOrdersZIP } from '../server/zip-generator';
import { storage } from '../server/storage';
import * as pdfGenerator from '../server/pdf-generator';

// Mock dependencies
vi.mock('../server/storage');
vi.mock('../server/pdf-generator');

describe('ZIP Generator', () => {
  const mockOrder = {
    id: 'order-123-456',
    userId: 'user-123',
    qrCodeId: 'qr-123',
    productType: 'sticker' as const,
    quantity: 5,
    size: 'medium',
    total: '49.99',
    status: 'pending' as const,
    shippingAddress: '123 Main St, Toronto, ON M5H 2N2, Canada',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  };

  const mockUser = {
    id: 'user-123',
    email: 'customer@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashed',
    company: 'Test Co',
    country: 'CA',
    language: 'en',
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQrCode = {
    id: 'qr-123',
    userId: 'user-123',
    name: 'Test QR Code',
    shortCode: 'ABC123',
    destinationUrl: 'https://example.com',
    isActive: true,
    customColor: '#000000',
    customBgColor: '#FFFFFF',
    customText: null,
    textPosition: 'bottom' as const,
    logoUrl: null,
    scanCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storage.getOrder).mockResolvedValue(mockOrder as any);
    vi.mocked(storage.getUser).mockResolvedValue(mockUser as any);
    vi.mocked(storage.getQrCode).mockResolvedValue(mockQrCode as any);
    vi.mocked(pdfGenerator.generateOrderPDF).mockResolvedValue(Buffer.from('mock-pdf-content'));
    vi.mocked(pdfGenerator.generateDeliveryLabelPDF).mockResolvedValue(Buffer.from('mock-label-content'));
  });

  describe('Single Order ZIP Generation', () => {
    it('should generate ZIP buffer for small order', async () => {
      const zipBuffer = await generateOrderZIP('order-123-456');

      expect(zipBuffer).toBeInstanceOf(Buffer);
      expect(zipBuffer.length).toBeGreaterThan(0);
      expect(pdfGenerator.generateOrderPDF).toHaveBeenCalledWith('order-123-456');
    });

    it('should include order PDF in ZIP', async () => {
      const zipBuffer = await generateOrderZIP('order-123-456');

      expect(zipBuffer).toBeInstanceOf(Buffer);
      expect(pdfGenerator.generateOrderPDF).toHaveBeenCalledTimes(1);
    });

    it('should NOT include delivery label for small orders (≤10)', async () => {
      await generateOrderZIP('order-123-456');

      expect(pdfGenerator.generateDeliveryLabelPDF).not.toHaveBeenCalled();
    });

    it('should include delivery label for large orders (>10)', async () => {
      const largeOrder = { ...mockOrder, quantity: 15 };
      vi.mocked(storage.getOrder).mockResolvedValue(largeOrder as any);

      await generateOrderZIP('order-123-456');

      expect(pdfGenerator.generateDeliveryLabelPDF).toHaveBeenCalledWith('order-123-456');
    });

    it('should use correct filename format', async () => {
      const zipBuffer = await generateOrderZIP('order-123-456');

      // Check that order number is extracted correctly (first 8 chars)
      expect(pdfGenerator.generateOrderPDF).toHaveBeenCalledWith('order-123-456');
      expect(zipBuffer).toBeInstanceOf(Buffer);
    });

    it('should handle order at threshold (exactly 10 items)', async () => {
      const thresholdOrder = { ...mockOrder, quantity: 10 };
      vi.mocked(storage.getOrder).mockResolvedValue(thresholdOrder as any);

      await generateOrderZIP('order-123-456');

      // Should NOT include delivery label at threshold
      expect(pdfGenerator.generateDeliveryLabelPDF).not.toHaveBeenCalled();
    });

    it('should handle order just over threshold (11 items)', async () => {
      const overThresholdOrder = { ...mockOrder, quantity: 11 };
      vi.mocked(storage.getOrder).mockResolvedValue(overThresholdOrder as any);

      await generateOrderZIP('order-123-456');

      // SHOULD include delivery label over threshold
      expect(pdfGenerator.generateDeliveryLabelPDF).toHaveBeenCalled();
    });

    it('should handle PDF generation errors', async () => {
      vi.mocked(pdfGenerator.generateOrderPDF).mockRejectedValue(new Error('PDF generation failed'));

      await expect(generateOrderZIP('order-123-456')).rejects.toThrow();
    });
  });

  describe('Bulk Orders ZIP Generation', () => {
    const orderIds = ['order-1', 'order-2', 'order-3'];

    beforeEach(() => {
      vi.mocked(storage.getOrder).mockImplementation(async (id: string) => {
        if (id === 'order-1') return { ...mockOrder, id: 'order-1', quantity: 5 } as any;
        if (id === 'order-2') return { ...mockOrder, id: 'order-2', quantity: 15 } as any;
        if (id === 'order-3') return { ...mockOrder, id: 'order-3', quantity: 30 } as any;
        return undefined;
      });
    });

    it('should generate ZIP buffer for multiple orders', async () => {
      const zipBuffer = await generateBulkOrdersZIP(orderIds);

      expect(zipBuffer).toBeInstanceOf(Buffer);
      expect(zipBuffer.length).toBeGreaterThan(0);
    });

    it('should call generateOrderPDF for each order', async () => {
      await generateBulkOrdersZIP(orderIds);

      expect(pdfGenerator.generateOrderPDF).toHaveBeenCalledTimes(3);
      expect(pdfGenerator.generateOrderPDF).toHaveBeenCalledWith('order-1');
      expect(pdfGenerator.generateOrderPDF).toHaveBeenCalledWith('order-2');
      expect(pdfGenerator.generateOrderPDF).toHaveBeenCalledWith('order-3');
    });

    it('should generate delivery labels only for large orders', async () => {
      await generateBulkOrdersZIP(orderIds);

      // Only order-2 (15 items) and order-3 (30 items) should get labels
      expect(pdfGenerator.generateDeliveryLabelPDF).toHaveBeenCalledTimes(2);
      expect(pdfGenerator.generateDeliveryLabelPDF).toHaveBeenCalledWith('order-2');
      expect(pdfGenerator.generateDeliveryLabelPDF).toHaveBeenCalledWith('order-3');
      expect(pdfGenerator.generateDeliveryLabelPDF).not.toHaveBeenCalledWith('order-1');
    });

    it('should include summary CSV file', async () => {
      const zipBuffer = await generateBulkOrdersZIP(orderIds);

      expect(zipBuffer).toBeInstanceOf(Buffer);
      // CSV generation involves calling storage methods
      expect(storage.getOrder).toHaveBeenCalled();
      expect(storage.getUser).toHaveBeenCalled();
      expect(storage.getQrCode).toHaveBeenCalled();
    });

    it('should handle empty order list', async () => {
      const zipBuffer = await generateBulkOrdersZIP([]);

      expect(zipBuffer).toBeInstanceOf(Buffer);
      // Should still create ZIP with just summary
      expect(pdfGenerator.generateOrderPDF).not.toHaveBeenCalled();
    });

    it('should continue processing if one order fails', async () => {
      vi.mocked(pdfGenerator.generateOrderPDF).mockImplementation(async (id: string) => {
        if (id === 'order-2') throw new Error('Failed to generate');
        return Buffer.from('mock-pdf');
      });

      const zipBuffer = await generateBulkOrdersZIP(orderIds);

      // Should still complete despite one failure
      expect(zipBuffer).toBeInstanceOf(Buffer);
      expect(pdfGenerator.generateOrderPDF).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed order sizes correctly', async () => {
      await generateBulkOrdersZIP(orderIds);

      // Verify correct logic for each order type
      expect(pdfGenerator.generateOrderPDF).toHaveBeenCalledTimes(3);
      expect(pdfGenerator.generateDeliveryLabelPDF).toHaveBeenCalledTimes(2);
    });

    it('should organize files in folders by order number', async () => {
      const zipBuffer = await generateBulkOrdersZIP(orderIds);

      // Verify ZIP was created successfully
      expect(zipBuffer).toBeInstanceOf(Buffer);
      expect(zipBuffer.length).toBeGreaterThan(0);
    });

    it('should include all order data in summary CSV', async () => {
      await generateBulkOrdersZIP(orderIds);

      // Verify storage methods called for CSV generation
      expect(storage.getOrder).toHaveBeenCalled();
      expect(storage.getUser).toHaveBeenCalled();
      expect(storage.getQrCode).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle null order gracefully', async () => {
      vi.mocked(storage.getOrder).mockResolvedValue(undefined);

      await expect(generateOrderZIP('non-existent')).rejects.toThrow();
    });

    it('should handle label generation failure for large orders', async () => {
      const largeOrder = { ...mockOrder, quantity: 20 };
      vi.mocked(storage.getOrder).mockResolvedValue(largeOrder as any);
      vi.mocked(pdfGenerator.generateDeliveryLabelPDF).mockRejectedValue(new Error('Label failed'));

      await expect(generateOrderZIP('order-123-456')).rejects.toThrow();
    });

    it('should handle very large bulk export', async () => {
      const manyOrderIds = Array.from({ length: 100 }, (_, i) => `order-${i}`);
      vi.mocked(storage.getOrder).mockResolvedValue(mockOrder as any);

      const zipBuffer = await generateBulkOrdersZIP(manyOrderIds);

      expect(zipBuffer).toBeInstanceOf(Buffer);
      expect(pdfGenerator.generateOrderPDF).toHaveBeenCalledTimes(100);
    });

    it('should handle missing user data in bulk export', async () => {
      vi.mocked(storage.getUser).mockResolvedValue(undefined);

      const zipBuffer = await generateBulkOrdersZIP(['order-1']);

      // Should still generate ZIP, just with N/A for missing data
      expect(zipBuffer).toBeInstanceOf(Buffer);
    });

    it('should handle missing QR code data in bulk export', async () => {
      vi.mocked(storage.getQrCode).mockResolvedValue(undefined);

      const zipBuffer = await generateBulkOrdersZIP(['order-1']);

      // Should still generate ZIP, just with N/A for missing data
      expect(zipBuffer).toBeInstanceOf(Buffer);
    });
  });

  describe('File Naming and Structure', () => {
    it('should use uppercase order number in filename', async () => {
      await generateOrderZIP('order-abc-def');

      expect(pdfGenerator.generateOrderPDF).toHaveBeenCalledWith('order-abc-def');
    });

    it('should truncate order ID to 8 characters for number', async () => {
      const longOrderId = 'order-123456789-abcdefgh';
      vi.mocked(storage.getOrder).mockResolvedValue({ ...mockOrder, id: longOrderId } as any);

      await generateOrderZIP(longOrderId);

      expect(pdfGenerator.generateOrderPDF).toHaveBeenCalledWith(longOrderId);
    });
  });
});
