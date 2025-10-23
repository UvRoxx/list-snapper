import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Simple email service without Redis queue - perfect for Railway
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "ca-central-1",
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY || "",
  },
});

// Simple email sending function
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  try {
    const command = new SendEmailCommand({
      Source: process.env.EMAIL_FROM || "noreply@snaplist.com",
      ReplyToAddresses: [process.env.EMAIL_REPLY_TO || "support@snaplist.com"],
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: html, Charset: "UTF-8" },
          Text: { Data: text, Charset: "UTF-8" },
        },
      },
    });

    await sesClient.send(command);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
}

// Order status email
export async function sendOrderStatusEmail(
  email: string,
  orderNumber: string,
  status: string,
  customerName?: string
): Promise<boolean> {
  const statusColors: Record<string, string> = {
    pending: '#FFA500',
    processing: '#007BFF',
    shipped: '#6F42C1',
    delivered: '#28A745',
    cancelled: '#DC3545',
  };

  const statusMessages: Record<string, string> = {
    pending: 'Your order has been received and is pending processing.',
    processing: 'Your order is being prepared.',
    shipped: 'Your order has been shipped and is on its way!',
    delivered: 'Your order has been delivered. Enjoy!',
    cancelled: 'Your order has been cancelled.',
  };

  const subject = `Order ${orderNumber} - ${status.charAt(0).toUpperCase() + status.slice(1)}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Order Update</h2>
      <p>Hi ${customerName || 'there'},</p>
      <p>Your order <strong>${orderNumber}</strong> status has been updated:</p>
      <div style="background: ${statusColors[status] || '#6c757d'}; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block;">
        ${status.toUpperCase()}
      </div>
      <p>${statusMessages[status] || 'Your order status has been updated.'}</p>
      <p>Thank you for shopping with SnapList!</p>
    </div>
  `;

  const text = `Order ${orderNumber} is now ${status}. ${statusMessages[status] || 'Your order status has been updated.'}`;

  return await sendEmail(email, subject, html, text);
}

// Welcome email
export async function sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
  const subject = "Welcome to SnapList!";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4F46E5;">Welcome to SnapList!</h1>
      <p>Hi ${name || 'there'},</p>
      <p>Thank you for joining SnapList. We're excited to have you on board!</p>
      <p>Start exploring our products and enjoy exclusive member benefits.</p>
      <a href="${process.env.APP_URL || 'https://snaplist.com'}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Start Shopping
      </a>
    </div>
  `;

  const text = `Welcome to SnapList! Thank you for joining us. Visit ${process.env.APP_URL || 'https://snaplist.com'} to start shopping.`;

  return await sendEmail(email, subject, html, text);
}

// Newsletter confirmation
export async function sendNewsletterConfirmation(email: string): Promise<boolean> {
  const subject = "Newsletter Subscription Confirmed";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">You're Subscribed!</h2>
      <p>Thank you for subscribing to the SnapList newsletter.</p>
      <p>You'll receive updates about new products, exclusive offers, and more.</p>
    </div>
  `;

  const text = "Thank you for subscribing to the SnapList newsletter!";

  return await sendEmail(email, subject, html, text);
}