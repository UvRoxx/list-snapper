import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Initialize AWS SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "ca-central-1",
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY || "",
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using AWS SES
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    const command = new SendEmailCommand({
      Source: process.env.EMAIL_FROM || "noreply@yourdomain.com",
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: html,
            Charset: "UTF-8",
          },
          Text: text ? {
            Data: text,
            Charset: "UTF-8",
          } : undefined,
        },
      },
      ReplyToAddresses: [process.env.EMAIL_REPLY_TO || "support@yourdomain.com"],
    });

    await sesClient.send(command);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Send order status update email to customer
 */
export async function sendOrderStatusEmail(
  email: string,
  orderNumber: string,
  status: string,
  customerName?: string
): Promise<boolean> {
  const statusMessages = {
    pending: {
      subject: `Order #${orderNumber} - Received`,
      message: "We've received your order and it's being prepared for processing.",
    },
    processing: {
      subject: `Order #${orderNumber} - In Processing`,
      message: "Your order is currently being processed and prepared for shipment.",
    },
    shipped: {
      subject: `Order #${orderNumber} - Shipped`,
      message: "Great news! Your order has been shipped and is on its way to you.",
    },
    delivered: {
      subject: `Order #${orderNumber} - Delivered`,
      message: "Your order has been delivered. We hope you enjoy your SnapList stickers!",
    },
    cancelled: {
      subject: `Order #${orderNumber} - Cancelled`,
      message: "Your order has been cancelled. If you have any questions, please contact us.",
    },
  };

  const statusInfo = statusMessages[status as keyof typeof statusMessages] || {
    subject: `Order #${orderNumber} - Status Update`,
    message: `Your order status has been updated to: ${status}`,
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px 20px;
          border-radius: 0 0 10px 10px;
        }
        .order-number {
          font-size: 24px;
          font-weight: bold;
          margin: 20px 0;
          color: #667eea;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          background: #667eea;
          color: white;
          border-radius: 20px;
          font-weight: 500;
          text-transform: capitalize;
        }
        .message {
          margin: 20px 0;
          padding: 15px;
          background: white;
          border-left: 4px solid #667eea;
          border-radius: 4px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 14px;
          color: #666;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SnapList</h1>
        <p>Order Status Update</p>
      </div>
      <div class="content">
        ${customerName ? `<p>Hi ${customerName},</p>` : '<p>Hello,</p>'}
        <div class="order-number">Order #${orderNumber}</div>
        <div style="margin: 20px 0;">
          <span class="status-badge">${status}</span>
        </div>
        <div class="message">
          <p>${statusInfo.message}</p>
        </div>
        <p>Thank you for choosing SnapList!</p>
      </div>
      <div class="footer">
        <p>This is an automated message from SnapList. Please do not reply to this email.</p>
        <p>If you have any questions, please contact us through our website.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    SnapList - Order Status Update

    ${customerName ? `Hi ${customerName},` : 'Hello,'}

    Order #${orderNumber}
    Status: ${status}

    ${statusInfo.message}

    Thank you for choosing SnapList!

    ---
    This is an automated message from SnapList. Please do not reply to this email.
  `;

  return sendEmail({
    to: email,
    subject: statusInfo.subject,
    html,
    text,
  });
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px 20px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 14px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to SnapList!</h1>
      </div>
      <div class="content">
        ${name ? `<p>Hi ${name},</p>` : '<p>Hello,</p>'}
        <p>Thank you for joining SnapList! We're excited to help you connect with your customers through innovative QR code stickers.</p>
        <p>Get started by creating your first QR code and ordering your custom stickers today.</p>
        <div style="text-align: center;">
          <a href="#" class="button">Get Started</a>
        </div>
      </div>
      <div class="footer">
        <p>This is an automated message from SnapList.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to SnapList!

    ${name ? `Hi ${name},` : 'Hello,'}

    Thank you for joining SnapList! We're excited to help you connect with your customers through innovative QR code stickers.

    Get started by creating your first QR code and ordering your custom stickers today.
  `;

  return sendEmail({
    to: email,
    subject: "Welcome to SnapList!",
    html,
    text,
  });
}

/**
 * Send newsletter subscription confirmation
 */
export async function sendNewsletterConfirmation(email: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px 20px;
          border-radius: 0 0 10px 10px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 14px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Thank You for Subscribing!</h1>
      </div>
      <div class="content">
        <p>You've successfully subscribed to the SnapList newsletter.</p>
        <p>We'll keep you updated with the latest news, features, and special offers.</p>
      </div>
      <div class="footer">
        <p>This is an automated message from SnapList.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Thank You for Subscribing!

    You've successfully subscribed to the SnapList newsletter.

    We'll keep you updated with the latest news, features, and special offers.
  `;

  return sendEmail({
    to: email,
    subject: "SnapList Newsletter - Subscription Confirmed",
    html,
    text,
  });
}
