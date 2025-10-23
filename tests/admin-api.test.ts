import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { registerRoutes } from '../server/routes';
import express from 'express';
import { storage } from '../server/storage';
import * as pdfGenerator from '../server/pdf-generator';
import * as zipGenerator from '../server/zip-generator';
import * as email from '../server/email';

// Mock dependencies
vi.mock('../server/storage');
vi.mock('../server/pdf-generator');
vi.mock('../server/zip-generator');
vi.mock('../server/email');

describe('Admin API Routes', () => {
  let app: express.Application;
  let adminToken: string;
  let userToken: string;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());

    // Mock JWT tokens (in real tests, generate proper tokens)
    adminToken = 'Bearer admin-token';
    userToken = 'Bearer user-token';
  });

  describe('Admin Settings Endpoints', () => {
    describe('GET /api/admin/settings', () => {
      it('should retrieve all settings for admin', async () => {
        const mockSettings = [
          { id: '1', key: 'email_from', value: 'test@example.com', category: 'email', description: null, updatedAt: new Date() },
          { id: '2', key: 'qr_style', value: 'rounded', category: 'qr', description: null, updatedAt: new Date() },
        ];

        vi.mocked(storage.getAllSettings).mockResolvedValue(mockSettings);

        const response = await request(app)
          .get('/api/admin/settings')
          .set('Authorization', adminToken)
          .expect(200);

        expect(response.body).toEqual(mockSettings);
        expect(storage.getAllSettings).toHaveBeenCalled();
      });

      it('should return 401 without authentication', async () => {
        await request(app)
          .get('/api/admin/settings')
          .expect(401);
      });

      it('should return 403 for non-admin users', async () => {
        await request(app)
          .get('/api/admin/settings')
          .set('Authorization', userToken)
          .expect(403);
      });

      it('should handle database errors', async () => {
        vi.mocked(storage.getAllSettings).mockRejectedValue(new Error('Database error'));

        await request(app)
          .get('/api/admin/settings')
          .set('Authorization', adminToken)
          .expect(500);
      });
    });

    describe('PUT /api/admin/settings', () => {
      it('should update multiple settings', async () => {
        const settings = [
          { key: 'email_from', value: 'new@example.com', category: 'email' },
          { key: 'qr_style', value: 'rounded', category: 'qr' },
        ];

        vi.mocked(storage.upsertSetting).mockResolvedValue({} as any);

        const response = await request(app)
          .put('/api/admin/settings')
          .set('Authorization', adminToken)
          .send({ settings })
          .expect(200);

        expect(response.body.message).toBe('Settings updated successfully');
        expect(storage.upsertSetting).toHaveBeenCalledTimes(2);
      });

      it('should validate request body', async () => {
        await request(app)
          .put('/api/admin/settings')
          .set('Authorization', adminToken)
          .send({}) // Missing settings
          .expect(400);
      });

      it('should require admin privileges', async () => {
        await request(app)
          .put('/api/admin/settings')
          .set('Authorization', userToken)
          .send({ settings: [] })
          .expect(403);
      });
    });
  });

  describe('Order PDF Generation Endpoints', () => {
    const mockPDFBuffer = Buffer.from('mock-pdf-content');
    const mockOrder = {
      id: 'order-123',
      userId: 'user-123',
      qrCodeId: 'qr-123',
      quantity: 5,
      total: '49.99',
      status: 'pending',
      shippingAddress: '123 Main St',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      vi.mocked(storage.getOrder).mockResolvedValue(mockOrder as any);
      vi.mocked(pdfGenerator.generateOrderPDF).mockResolvedValue(mockPDFBuffer);
      vi.mocked(pdfGenerator.generateDeliveryLabelPDF).mockResolvedValue(mockPDFBuffer);
    });

    describe('GET /api/admin/orders/:id/pdf', () => {
      it('should generate and return order PDF', async () => {
        const response = await request(app)
          .get('/api/admin/orders/order-123/pdf')
          .set('Authorization', adminToken)
          .expect(200)
          .expect('Content-Type', 'application/pdf');

        expect(response.body).toEqual(mockPDFBuffer);
        expect(pdfGenerator.generateOrderPDF).toHaveBeenCalledWith('order-123');
      });

      it('should set correct filename in headers', async () => {
        const response = await request(app)
          .get('/api/admin/orders/order-123/pdf')
          .set('Authorization', adminToken)
          .expect(200);

        expect(response.headers['content-disposition']).toContain('attachment');
        expect(response.headers['content-disposition']).toContain('.pdf');
      });

      it('should require admin authentication', async () => {
        await request(app)
          .get('/api/admin/orders/order-123/pdf')
          .expect(401);
      });

      it('should handle PDF generation errors', async () => {
        vi.mocked(pdfGenerator.generateOrderPDF).mockRejectedValue(new Error('PDF generation failed'));

        await request(app)
          .get('/api/admin/orders/order-123/pdf')
          .set('Authorization', adminToken)
          .expect(500);
      });
    });

    describe('GET /api/admin/orders/:id/label', () => {
      it('should generate and return delivery label', async () => {
        const response = await request(app)
          .get('/api/admin/orders/order-123/label')
          .set('Authorization', adminToken)
          .expect(200)
          .expect('Content-Type', 'application/pdf');

        expect(response.body).toEqual(mockPDFBuffer);
        expect(pdfGenerator.generateDeliveryLabelPDF).toHaveBeenCalledWith('order-123');
      });

      it('should set correct filename for label', async () => {
        const response = await request(app)
          .get('/api/admin/orders/order-123/label')
          .set('Authorization', adminToken)
          .expect(200);

        expect(response.headers['content-disposition']).toContain('label');
      });
    });

    describe('GET /api/admin/orders/:id/zip', () => {
      const mockZIPBuffer = Buffer.from('mock-zip-content');

      beforeEach(() => {
        vi.mocked(zipGenerator.generateOrderZIP).mockResolvedValue(mockZIPBuffer);
      });

      it('should generate and return order ZIP', async () => {
        const response = await request(app)
          .get('/api/admin/orders/order-123/zip')
          .set('Authorization', adminToken)
          .expect(200)
          .expect('Content-Type', 'application/zip');

        expect(response.body).toEqual(mockZIPBuffer);
        expect(zipGenerator.generateOrderZIP).toHaveBeenCalledWith('order-123');
      });

      it('should set correct ZIP filename', async () => {
        const response = await request(app)
          .get('/api/admin/orders/order-123/zip')
          .set('Authorization', adminToken)
          .expect(200);

        expect(response.headers['content-disposition']).toContain('.zip');
      });
    });
  });

  describe('Bulk Order Export', () => {
    const mockZIPBuffer = Buffer.from('mock-bulk-zip');

    beforeEach(() => {
      vi.mocked(zipGenerator.generateBulkOrdersZIP).mockResolvedValue(mockZIPBuffer);
    });

    describe('POST /api/admin/orders/bulk-export', () => {
      it('should export multiple orders as ZIP', async () => {
        const orderIds = ['order-1', 'order-2', 'order-3'];

        const response = await request(app)
          .post('/api/admin/orders/bulk-export')
          .set('Authorization', adminToken)
          .send({ orderIds })
          .expect(200)
          .expect('Content-Type', 'application/zip');

        expect(response.body).toEqual(mockZIPBuffer);
        expect(zipGenerator.generateBulkOrdersZIP).toHaveBeenCalledWith(orderIds);
      });

      it('should validate orderIds array', async () => {
        await request(app)
          .post('/api/admin/orders/bulk-export')
          .set('Authorization', adminToken)
          .send({}) // Missing orderIds
          .expect(400);
      });

      it('should reject empty orderIds array', async () => {
        await request(app)
          .post('/api/admin/orders/bulk-export')
          .set('Authorization', adminToken)
          .send({ orderIds: [] })
          .expect(400);
      });

      it('should include timestamp in filename', async () => {
        const response = await request(app)
          .post('/api/admin/orders/bulk-export')
          .set('Authorization', adminToken)
          .send({ orderIds: ['order-1'] })
          .expect(200);

        expect(response.headers['content-disposition']).toMatch(/orders-\d{4}-\d{2}-\d{2}\.zip/);
      });

      it('should require admin privileges', async () => {
        await request(app)
          .post('/api/admin/orders/bulk-export')
          .set('Authorization', userToken)
          .send({ orderIds: ['order-1'] })
          .expect(403);
      });
    });
  });

  describe('Order Status Update with Email', () => {
    const mockOrder = {
      id: 'order-123',
      userId: 'user-123',
      userEmail: 'customer@example.com',
      userName: 'John Doe',
      quantity: 5,
      status: 'pending',
    };

    beforeEach(() => {
      vi.mocked(storage.updateOrder).mockResolvedValue(mockOrder as any);
      vi.mocked(email.sendOrderStatusEmail).mockResolvedValue(true);
    });

    describe('PATCH /api/admin/orders/:id', () => {
      it('should update order status and send email', async () => {
        const response = await request(app)
          .patch('/api/admin/orders/order-123')
          .set('Authorization', adminToken)
          .send({ status: 'shipped' })
          .expect(200);

        expect(storage.updateOrder).toHaveBeenCalledWith('order-123', { status: 'shipped' });
        expect(email.sendOrderStatusEmail).toHaveBeenCalledWith(
          'customer@example.com',
          expect.any(String),
          'shipped',
          'John Doe'
        );
      });

      it('should not send email if status not changed', async () => {
        await request(app)
          .patch('/api/admin/orders/order-123')
          .set('Authorization', adminToken)
          .send({ quantity: 10 }) // Not status update
          .expect(200);

        expect(email.sendOrderStatusEmail).not.toHaveBeenCalled();
      });

      it('should handle email sending failures gracefully', async () => {
        vi.mocked(email.sendOrderStatusEmail).mockRejectedValue(new Error('Email failed'));

        // Should still update order even if email fails
        await request(app)
          .patch('/api/admin/orders/order-123')
          .set('Authorization', adminToken)
          .send({ status: 'shipped' })
          .expect(200);

        expect(storage.updateOrder).toHaveBeenCalled();
      });
    });
  });

  describe('Newsletter Subscription', () => {
    beforeEach(() => {
      vi.mocked(storage.addNewsletterSubscriber).mockResolvedValue();
      vi.mocked(email.sendNewsletterConfirmation).mockResolvedValue(true);
    });

    describe('POST /api/newsletter/subscribe', () => {
      it('should subscribe email to newsletter', async () => {
        const response = await request(app)
          .post('/api/newsletter/subscribe')
          .send({ email: 'subscriber@example.com' })
          .expect(200);

        expect(response.body.message).toBe('Successfully subscribed to newsletter');
        expect(storage.addNewsletterSubscriber).toHaveBeenCalledWith('subscriber@example.com');
        expect(email.sendNewsletterConfirmation).toHaveBeenCalledWith('subscriber@example.com');
      });

      it('should validate email format', async () => {
        await request(app)
          .post('/api/newsletter/subscribe')
          .send({ email: 'invalid-email' })
          .expect(400);
      });

      it('should require email in request', async () => {
        await request(app)
          .post('/api/newsletter/subscribe')
          .send({})
          .expect(400);
      });

      it('should handle duplicate subscriptions', async () => {
        // Storage handles duplicates with onConflictDoNothing
        await request(app)
          .post('/api/newsletter/subscribe')
          .send({ email: 'existing@example.com' })
          .expect(200);

        expect(storage.addNewsletterSubscriber).toHaveBeenCalled();
      });

      it('should handle database errors', async () => {
        vi.mocked(storage.addNewsletterSubscriber).mockRejectedValue(new Error('DB error'));

        await request(app)
          .post('/api/newsletter/subscribe')
          .send({ email: 'test@example.com' })
          .expect(400);
      });

      it('should not require authentication', async () => {
        // Public endpoint - should work without auth
        await request(app)
          .post('/api/newsletter/subscribe')
          .send({ email: 'public@example.com' })
          .expect(200);
      });
    });
  });

  describe('Error Responses', () => {
    it('should return JSON error for PDF generation failures', async () => {
      vi.mocked(pdfGenerator.generateOrderPDF).mockRejectedValue(new Error('Generation failed'));

      const response = await request(app)
        .get('/api/admin/orders/order-123/pdf')
        .set('Authorization', adminToken)
        .expect(500);

      expect(response.body).toHaveProperty('message');
    });

    it('should log errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      vi.mocked(pdfGenerator.generateOrderPDF).mockRejectedValue(new Error('Test error'));

      await request(app)
        .get('/api/admin/orders/order-123/pdf')
        .set('Authorization', adminToken)
        .expect(500);

      expect(consoleSpy).toHaveBeenCalledWith('PDF generation error:', expect.any(Error));
    });
  });

  describe('Authorization and Security', () => {
    it('should reject requests without Bearer token', async () => {
      await request(app)
        .get('/api/admin/settings')
        .set('Authorization', 'InvalidToken')
        .expect(401);
    });

    it('should reject expired tokens', async () => {
      await request(app)
        .get('/api/admin/settings')
        .set('Authorization', 'Bearer expired-token')
        .expect(401);
    });

    it('should validate admin role for all admin endpoints', async () => {
      const adminEndpoints = [
        { method: 'get', path: '/api/admin/settings' },
        { method: 'put', path: '/api/admin/settings' },
        { method: 'get', path: '/api/admin/orders/123/pdf' },
        { method: 'post', path: '/api/admin/orders/bulk-export' },
      ];

      for (const endpoint of adminEndpoints) {
        await request(app)[endpoint.method](endpoint.path)
          .set('Authorization', userToken)
          .expect(403);
      }
    });
  });
});
