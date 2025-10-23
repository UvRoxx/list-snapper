import archiver from 'archiver';
import { Readable } from 'stream';
import { generateOrderPDF, generateDeliveryLabelPDF } from './pdf-generator';

const SMALL_ORDER_THRESHOLD = 10;

/**
 * Generate ZIP file containing order PDFs
 * For small orders: single PDF with QR codes + address
 * For large orders: QR codes PDF + separate delivery label PDF
 */
export async function generateOrderZIP(orderId: string): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      const chunks: Buffer[] = [];

      archive.on('data', chunk => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);

      // Generate main order PDF
      const orderPDF = await generateOrderPDF(orderId);
      const orderNumber = orderId.slice(0, 8).toUpperCase();

      // Add order PDF to archive
      const orderStream = Readable.from(orderPDF);
      archive.append(orderStream, { name: `order-${orderNumber}.pdf` });

      // For large orders, also generate separate delivery label
      const order = await import('./storage').then(m => m.storage.getOrder(orderId));
      if (order && order.quantity > SMALL_ORDER_THRESHOLD) {
        const labelPDF = await generateDeliveryLabelPDF(orderId);
        const labelStream = Readable.from(labelPDF);
        archive.append(labelStream, { name: `delivery-label-${orderNumber}.pdf` });
      }

      // Finalize the archive
      await archive.finalize();
    } catch (error) {
      console.error('Error generating order ZIP:', error);
      reject(error);
    }
  });
}

/**
 * Generate bulk ZIP for multiple orders (for admin bulk export)
 */
export async function generateBulkOrdersZIP(orderIds: string[]): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      const chunks: Buffer[] = [];

      archive.on('data', chunk => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);

      // Process each order
      for (const orderId of orderIds) {
        try {
          const orderNumber = orderId.slice(0, 8).toUpperCase();

          // Generate order PDF
          const orderPDF = await generateOrderPDF(orderId);
          const orderStream = Readable.from(orderPDF);
          archive.append(orderStream, { name: `${orderNumber}/order.pdf` });

          // Check if large order for delivery label
          const order = await import('./storage').then(m => m.storage.getOrder(orderId));
          if (order && order.quantity > SMALL_ORDER_THRESHOLD) {
            const labelPDF = await generateDeliveryLabelPDF(orderId);
            const labelStream = Readable.from(labelPDF);
            archive.append(labelStream, { name: `${orderNumber}/delivery-label.pdf` });
          }
        } catch (error) {
          console.error(`Error processing order ${orderId}:`, error);
          // Continue with other orders even if one fails
        }
      }

      // Add a summary CSV file
      const { storage } = await import('./storage');
      const summaryData: string[] = ['Order ID,Customer Email,QR Code,Quantity,Total,Status,Date'];

      for (const orderId of orderIds) {
        try {
          const order = await storage.getOrder(orderId);
          if (order) {
            const user = await storage.getUser(order.userId);
            const qrCode = await storage.getQrCode(order.qrCodeId);

            summaryData.push([
              orderId.slice(0, 8).toUpperCase(),
              user?.email || 'N/A',
              qrCode?.name || 'N/A',
              order.quantity,
              order.total,
              order.status || 'pending',
              new Date(order.createdAt).toLocaleDateString()
            ].join(','));
          }
        } catch (error) {
          console.error(`Error fetching order data for ${orderId}:`, error);
        }
      }

      const summaryCSV = summaryData.join('\n');
      archive.append(summaryCSV, { name: 'fulfillment-summary.csv' });

      // Finalize the archive
      await archive.finalize();
    } catch (error) {
      console.error('Error generating bulk orders ZIP:', error);
      reject(error);
    }
  });
}
