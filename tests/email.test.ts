import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sendEmail, sendOrderStatusEmail, sendWelcomeEmail, sendNewsletterConfirmation } from '../server/email';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Mock AWS SES
vi.mock('@aws-sdk/client-ses', () => {
  const mockSend = vi.fn();
  return {
    SESClient: vi.fn(() => ({
      send: mockSend,
    })),
    SendEmailCommand: vi.fn(),
  };
});

describe('Email Service', () => {
  let mockSend: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const sesInstance = new SESClient({});
    mockSend = sesInstance.send;
    mockSend.mockResolvedValue({ MessageId: 'mock-message-id' });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should include email content in command', async () => {
      await sendEmail({
        to: 'recipient@example.com',
        subject: 'Important Message',
        html: '<h1>Hello World</h1>',
      });

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Destination: {
            ToAddresses: ['recipient@example.com'],
          },
          Message: {
            Subject: {
              Data: 'Important Message',
              Charset: 'UTF-8',
            },
            Body: expect.objectContaining({
              Html: {
                Data: '<h1>Hello World</h1>',
                Charset: 'UTF-8',
              },
            }),
          },
        })
      );
    });

    it('should include plain text version if provided', async () => {
      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>HTML version</p>',
        text: 'Plain text version',
      });

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Body: expect.objectContaining({
              Text: {
                Data: 'Plain text version',
                Charset: 'UTF-8',
              },
            }),
          }),
        })
      );
    });

    it('should use configured FROM address', async () => {
      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Source: process.env.EMAIL_FROM,
        })
      );
    });

    it('should set reply-to address', async () => {
      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          ReplyToAddresses: [process.env.EMAIL_REPLY_TO],
        })
      );
    });

    it('should handle SES errors gracefully', async () => {
      mockSend.mockRejectedValue(new Error('SES Error'));

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(false);
    });

    it('should log errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      mockSend.mockRejectedValue(new Error('Network error'));

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error sending email:', expect.any(Error));
    });
  });

  describe('sendOrderStatusEmail', () => {
    const defaultParams = {
      email: 'customer@example.com',
      orderNumber: 'ORDER123',
      status: 'pending',
      customerName: 'John Doe',
    };

    it('should send order status email for pending status', async () => {
      const result = await sendOrderStatusEmail(
        defaultParams.email,
        defaultParams.orderNumber,
        'pending',
        defaultParams.customerName
      );

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should include customer name in email if provided', async () => {
      await sendOrderStatusEmail(
        defaultParams.email,
        defaultParams.orderNumber,
        'pending',
        'Jane Smith'
      );

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Body: expect.objectContaining({
              Html: expect.objectContaining({
                Data: expect.stringContaining('Jane Smith'),
              }),
            }),
          }),
        })
      );
    });

    it('should use generic greeting if no customer name', async () => {
      await sendOrderStatusEmail(defaultParams.email, defaultParams.orderNumber, 'pending');

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Body: expect.objectContaining({
              Html: expect.objectContaining({
                Data: expect.stringContaining('Hello,'),
              }),
            }),
          }),
        })
      );
    });

    it('should have correct subject for processing status', async () => {
      await sendOrderStatusEmail(
        defaultParams.email,
        defaultParams.orderNumber,
        'processing',
        defaultParams.customerName
      );

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Subject: expect.objectContaining({
              Data: expect.stringContaining('In Processing'),
            }),
          }),
        })
      );
    });

    it('should have correct subject for shipped status', async () => {
      await sendOrderStatusEmail(
        defaultParams.email,
        defaultParams.orderNumber,
        'shipped',
        defaultParams.customerName
      );

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Subject: expect.objectContaining({
              Data: expect.stringContaining('Shipped'),
            }),
          }),
        })
      );
    });

    it('should have correct subject for delivered status', async () => {
      await sendOrderStatusEmail(
        defaultParams.email,
        defaultParams.orderNumber,
        'delivered',
        defaultParams.customerName
      );

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Subject: expect.objectContaining({
              Data: expect.stringContaining('Delivered'),
            }),
          }),
        })
      );
    });

    it('should have correct subject for cancelled status', async () => {
      await sendOrderStatusEmail(
        defaultParams.email,
        defaultParams.orderNumber,
        'cancelled',
        defaultParams.customerName
      );

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Subject: expect.objectContaining({
              Data: expect.stringContaining('Cancelled'),
            }),
          }),
        })
      );
    });

    it('should handle unknown status gracefully', async () => {
      await sendOrderStatusEmail(
        defaultParams.email,
        defaultParams.orderNumber,
        'unknown-status',
        defaultParams.customerName
      );

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Subject: expect.objectContaining({
              Data: expect.stringContaining('Status Update'),
            }),
          }),
        })
      );
    });

    it('should include order number in email content', async () => {
      await sendOrderStatusEmail(
        defaultParams.email,
        'ORDER999',
        'pending',
        defaultParams.customerName
      );

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Body: expect.objectContaining({
              Html: expect.objectContaining({
                Data: expect.stringContaining('ORDER999'),
              }),
            }),
          }),
        })
      );
    });

    it('should include status badge in HTML', async () => {
      await sendOrderStatusEmail(
        defaultParams.email,
        defaultParams.orderNumber,
        'shipped',
        defaultParams.customerName
      );

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Body: expect.objectContaining({
              Html: expect.objectContaining({
                Data: expect.stringContaining('status-badge'),
              }),
            }),
          }),
        })
      );
    });

    it('should include plain text version', async () => {
      await sendOrderStatusEmail(
        defaultParams.email,
        defaultParams.orderNumber,
        'pending',
        defaultParams.customerName
      );

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Body: expect.objectContaining({
              Text: expect.any(Object),
            }),
          }),
        })
      );
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const result = await sendWelcomeEmail('newuser@example.com', 'New User');

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should include user name if provided', async () => {
      await sendWelcomeEmail('user@example.com', 'Alice Johnson');

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Body: expect.objectContaining({
              Html: expect.objectContaining({
                Data: expect.stringContaining('Alice Johnson'),
              }),
            }),
          }),
        })
      );
    });

    it('should use generic greeting if no name provided', async () => {
      await sendWelcomeEmail('user@example.com');

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Body: expect.objectContaining({
              Html: expect.objectContaining({
                Data: expect.stringContaining('Hello,'),
              }),
            }),
          }),
        })
      );
    });

    it('should have correct subject', async () => {
      await sendWelcomeEmail('user@example.com');

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Subject: expect.objectContaining({
              Data: 'Welcome to SnapList!',
            }),
          }),
        })
      );
    });

    it('should include CTA button', async () => {
      await sendWelcomeEmail('user@example.com');

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Body: expect.objectContaining({
              Html: expect.objectContaining({
                Data: expect.stringContaining('Get Started'),
              }),
            }),
          }),
        })
      );
    });
  });

  describe('sendNewsletterConfirmation', () => {
    it('should send newsletter confirmation successfully', async () => {
      const result = await sendNewsletterConfirmation('subscriber@example.com');

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should have correct subject', async () => {
      await sendNewsletterConfirmation('subscriber@example.com');

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Subject: expect.objectContaining({
              Data: 'SnapList Newsletter - Subscription Confirmed',
            }),
          }),
        })
      );
    });

    it('should include confirmation message', async () => {
      await sendNewsletterConfirmation('subscriber@example.com');

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Body: expect.objectContaining({
              Html: expect.objectContaining({
                Data: expect.stringContaining('successfully subscribed'),
              }),
            }),
          }),
        })
      );
    });

    it('should include plain text version', async () => {
      await sendNewsletterConfirmation('subscriber@example.com');

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Body: expect.objectContaining({
              Text: expect.any(Object),
            }),
          }),
        })
      );
    });
  });

  describe('Email Template Quality', () => {
    it('should include responsive HTML in order emails', async () => {
      await sendOrderStatusEmail('customer@example.com', 'ORDER123', 'pending');

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Body: expect.objectContaining({
              Html: expect.objectContaining({
                Data: expect.stringContaining('<!DOCTYPE html>'),
              }),
            }),
          }),
        })
      );
    });

    it('should include meta viewport in HTML emails', async () => {
      await sendWelcomeEmail('user@example.com');

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Body: expect.objectContaining({
              Html: expect.objectContaining({
                Data: expect.stringContaining('viewport'),
              }),
            }),
          }),
        })
      );
    });

    it('should use UTF-8 charset', async () => {
      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Subject: expect.objectContaining({
              Charset: 'UTF-8',
            }),
            Body: expect.objectContaining({
              Html: expect.objectContaining({
                Charset: 'UTF-8',
              }),
            }),
          }),
        })
      );
    });
  });
});
