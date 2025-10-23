import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateSmallOrderPDF, generateLargeOrderPDF, generateOrderPDF, generateDeliveryLabelPDF } from '../server/pdf-generator';
import { storage } from '../server/storage';

// Mock storage
vi.mock('../server/storage', () => ({
  storage: {
    getOrder: vi.fn(),
    getUser: vi.fn(),
    getQrCode: vi.fn(),
  },
}));

describe('PDF Generator', () => {
  const mockOrderData = {
    id: 'order-123-456',
    userEmail: 'customer@example.com',
    userName: 'John Doe',
    qrCodeName: 'Test QR Code',
    qrCodeUrl: 'http://localhost:5173/qr/ABC123',
    quantity: 5,
    shippingAddress: '123 Main St, Toronto, ON M5H 2N2, Canada',
    orderNumber: 'ORDER123',
  };

  describe('Small Order PDF Generation', () => {
    it('should generate PDF buffer for small orders', async () => {
      const pdfBuffer = await generateSmallOrderPDF(mockOrderData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should include order number in PDF', async () => {
      const pdfBuffer = await generateSmallOrderPDF(mockOrderData);
      const pdfString = pdfBuffer.toString('utf-8');

      expect(pdfString).toContain('ORDER123');
    });

    it('should include delivery address in PDF', async () => {
      const pdfBuffer = await generateSmallOrderPDF(mockOrderData);
      const pdfString = pdfBuffer.toString('utf-8');

      expect(pdfString).toContain('DELIVERY ADDRESS');
    });

    it('should handle orders with 1 item', async () => {
      const singleItemOrder = { ...mockOrderData, quantity: 1 };
      const pdfBuffer = await generateSmallOrderPDF(singleItemOrder);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should handle orders at threshold (10 items)', async () => {
      const thresholdOrder = { ...mockOrderData, quantity: 10 };
      const pdfBuffer = await generateSmallOrderPDF(thresholdOrder);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should handle missing user name gracefully', async () => {
      const noNameOrder = { ...mockOrderData, userName: undefined };
      const pdfBuffer = await generateSmallOrderPDF(noNameOrder);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      const pdfString = pdfBuffer.toString('utf-8');
      expect(pdfString).toContain(mockOrderData.userEmail);
    });
  });

  describe('Large Order PDF Generation', () => {
    const largeOrderData = { ...mockOrderData, quantity: 30 };

    it('should generate PDF buffer for large orders', async () => {
      const pdfBuffer = await generateLargeOrderPDF(largeOrderData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should NOT include delivery address in PDF', async () => {
      const pdfBuffer = await generateLargeOrderPDF(largeOrderData);
      const pdfString = pdfBuffer.toString('utf-8');

      expect(pdfString).not.toContain('DELIVERY ADDRESS');
    });

    it('should generate multiple pages for large quantities', async () => {
      const pdfBuffer = await generateLargeOrderPDF(largeOrderData);
      const pdfString = pdfBuffer.toString('utf-8');

      // Check for page indicators
      expect(pdfString).toContain('Page 1');
      expect(pdfString).toContain('Page 2');
    });

    it('should calculate correct number of pages (6 per page)', async () => {
      const order18Items = { ...mockOrderData, quantity: 18 };
      const pdfBuffer = await generateLargeOrderPDF(order18Items);
      const pdfString = pdfBuffer.toString('utf-8');

      // 18 items = 3 pages (6 per page)
      expect(pdfString).toContain('Page 1/3');
      expect(pdfString).toContain('Page 3/3');
    });

    it('should handle exactly 6 items (1 page)', async () => {
      const order6Items = { ...mockOrderData, quantity: 6 };
      const pdfBuffer = await generateLargeOrderPDF(order6Items);
      const pdfString = pdfBuffer.toString('utf-8');

      expect(pdfString).toContain('Page 1/1');
    });

    it('should number QR codes sequentially', async () => {
      const pdfBuffer = await generateLargeOrderPDF(largeOrderData);
      const pdfString = pdfBuffer.toString('utf-8');

      expect(pdfString).toContain('#1');
      expect(pdfString).toContain('#30');
    });
  });

  describe('Delivery Label PDF Generation', () => {
    beforeEach(() => {
      vi.mocked(storage.getOrder).mockResolvedValue({
        id: 'order-123-456',
        userId: 'user-123',
        qrCodeId: 'qr-123',
        productType: 'sticker',
        quantity: 30,
        size: 'medium',
        total: '149.99',
        status: 'pending',
        shippingAddress: '123 Main St, Toronto, ON M5H 2N2, Canada',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      } as any);

      vi.mocked(storage.getUser).mockResolvedValue({
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
      } as any);
    });

    it('should generate delivery label PDF', async () => {
      const pdfBuffer = await generateDeliveryLabelPDF('order-123-456');

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should include order number in label', async () => {
      const pdfBuffer = await generateDeliveryLabelPDF('order-123-456');
      const pdfString = pdfBuffer.toString('utf-8');

      expect(pdfString).toContain('ORDER123');
    });

    it('should include SHIP TO text', async () => {
      const pdfBuffer = await generateDeliveryLabelPDF('order-123-456');
      const pdfString = pdfBuffer.toString('utf-8');

      expect(pdfString).toContain('SHIP TO');
    });

    it('should throw error for non-existent order', async () => {
      vi.mocked(storage.getOrder).mockResolvedValue(undefined);

      await expect(generateDeliveryLabelPDF('non-existent')).rejects.toThrow('Order not found');
    });

    it('should throw error for non-existent user', async () => {
      vi.mocked(storage.getUser).mockResolvedValue(undefined);

      await expect(generateDeliveryLabelPDF('order-123-456')).rejects.toThrow('User not found');
    });
  });

  describe('Smart Order PDF Generation', () => {
    beforeEach(() => {
      vi.mocked(storage.getOrder).mockResolvedValue({
        id: 'order-123-456',
        userId: 'user-123',
        qrCodeId: 'qr-123',
        productType: 'sticker',
        quantity: 5,
        size: 'medium',
        total: '49.99',
        status: 'pending',
        shippingAddress: '123 Main St, Toronto, ON M5H 2N2, Canada',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      } as any);

      vi.mocked(storage.getUser).mockResolvedValue({
        id: 'user-123',
        email: 'customer@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'hashed',
        company: null,
        country: 'CA',
        language: 'en',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.mocked(storage.getQrCode).mockResolvedValue({
        id: 'qr-123',
        userId: 'user-123',
        name: 'Test QR Code',
        shortCode: 'ABC123',
        destinationUrl: 'https://example.com',
        isActive: true,
        customColor: '#000000',
        customBgColor: '#FFFFFF',
        customText: null,
        textPosition: 'bottom',
        logoUrl: null,
        scanCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
    });

    it('should use small layout for orders <= 10 items', async () => {
      const pdfBuffer = await generateOrderPDF('order-123-456');
      const pdfString = pdfBuffer.toString('utf-8');

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfString).toContain('DELIVERY ADDRESS');
    });

    it('should use large layout for orders > 10 items', async () => {
      vi.mocked(storage.getOrder).mockResolvedValue({
        id: 'order-123-456',
        userId: 'user-123',
        qrCodeId: 'qr-123',
        productType: 'sticker',
        quantity: 15,
        size: 'medium',
        total: '149.99',
        status: 'pending',
        shippingAddress: '123 Main St',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const pdfBuffer = await generateOrderPDF('order-123-456');
      const pdfString = pdfBuffer.toString('utf-8');

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfString).not.toContain('DELIVERY ADDRESS');
      expect(pdfString).toContain('Page');
    });

    it('should throw error for non-existent order', async () => {
      vi.mocked(storage.getOrder).mockResolvedValue(undefined);

      await expect(generateOrderPDF('non-existent')).rejects.toThrow('Order not found');
    });

    it('should throw error for missing QR code', async () => {
      vi.mocked(storage.getQrCode).mockResolvedValue(undefined);

      await expect(generateOrderPDF('order-123-456')).rejects.toThrow('User or QR code not found');
    });

    it('should construct correct QR code URL', async () => {
      const pdfBuffer = await generateOrderPDF('order-123-456');

      expect(vi.mocked(storage.getQrCode)).toHaveBeenCalledWith('qr-123');
      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should handle boundary case (exactly 10 items)', async () => {
      vi.mocked(storage.getOrder).mockResolvedValue({
        id: 'order-123-456',
        userId: 'user-123',
        qrCodeId: 'qr-123',
        productType: 'sticker',
        quantity: 10,
        size: 'medium',
        total: '99.99',
        status: 'pending',
        shippingAddress: '123 Main St',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const pdfBuffer = await generateOrderPDF('order-123-456');
      const pdfString = pdfBuffer.toString('utf-8');

      // Should use small layout at threshold
      expect(pdfString).toContain('DELIVERY ADDRESS');
    });
  });

  describe('Error Handling', () => {
    it('should handle QR code generation failure gracefully', async () => {
      const invalidOrderData = {
        ...mockOrderData,
        qrCodeUrl: '', // Invalid URL
      };

      await expect(generateSmallOrderPDF(invalidOrderData)).rejects.toThrow();
    });

    it('should handle extremely large orders', async () => {
      const hugeOrder = { ...mockOrderData, quantity: 1000 };
      const pdfBuffer = await generateLargeOrderPDF(hugeOrder);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });
});
