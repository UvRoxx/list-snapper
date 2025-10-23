import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { storage } from './storage';

interface OrderData {
  id: string;
  userEmail: string;
  userName?: string;
  qrCodeName: string;
  qrCodeUrl: string;
  quantity: number;
  shippingAddress: string;
  orderNumber: string;
}

// Configuration
const SMALL_ORDER_THRESHOLD = 10; // Orders <= 10 items use small layout
const QR_SIZE = 200; // QR code size in pixels
const A4_WIDTH = 595.28; // A4 width in points (210mm)
const A4_HEIGHT = 841.89; // A4 height in points (297mm)

/**
 * Generate QR code as buffer
 */
async function generateQRCodeBuffer(url: string): Promise<Buffer> {
  return await QRCode.toBuffer(url, {
    width: QR_SIZE,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
}

/**
 * Generate PDF for small orders (QR codes + delivery address in grid)
 * Layout: 4x6 grid = 24 QR codes per page max
 */
export async function generateSmallOrderPDF(orderData: OrderData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40
      });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Generate QR code buffer
      const qrBuffer = await generateQRCodeBuffer(orderData.qrCodeUrl);

      // Calculate grid layout
      const cols = 4;
      const rows = 6;
      const cellWidth = (A4_WIDTH - 80) / cols; // 80 = margins
      const cellHeight = (A4_HEIGHT - 120) / (rows + 1); // Extra row for address
      const qrDisplaySize = Math.min(cellWidth, cellHeight) - 20;

      // Title
      doc.fontSize(16).font('Helvetica-Bold')
        .text(`Order #${orderData.orderNumber}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica')
        .text(`${orderData.quantity} x ${orderData.qrCodeName}`, { align: 'center' });
      doc.moveDown(1);

      // Draw QR codes in grid
      let currentX = 40;
      let currentY = doc.y;
      let count = 0;

      for (let row = 0; row < rows && count < orderData.quantity; row++) {
        for (let col = 0; col < cols && count < orderData.quantity; col++) {
          const x = 40 + (col * cellWidth) + (cellWidth - qrDisplaySize) / 2;
          const y = currentY + (row * cellHeight) + (cellHeight - qrDisplaySize) / 2;

          // Draw QR code
          doc.image(qrBuffer, x, y, { width: qrDisplaySize, height: qrDisplaySize });

          // Add QR code name below
          doc.fontSize(8).font('Helvetica')
            .text(orderData.qrCodeName, x, y + qrDisplaySize + 5, {
              width: qrDisplaySize,
              align: 'center'
            });

          count++;
        }
      }

      // Add delivery address section at bottom
      const addressY = currentY + (rows * cellHeight) + 20;
      doc.moveTo(40, addressY).lineTo(A4_WIDTH - 40, addressY).stroke();
      doc.moveDown(0.5);

      doc.fontSize(12).font('Helvetica-Bold')
        .text('DELIVERY ADDRESS', 40, addressY + 10);
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica')
        .text(orderData.userName || orderData.userEmail, 40);
      doc.fontSize(9)
        .text(orderData.shippingAddress, 40, doc.y, { width: A4_WIDTH - 80 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate PDF for large orders (QR codes only, 6 per page)
 * Layout: 2x3 grid = 6 QR codes per page
 */
export async function generateLargeOrderPDF(orderData: OrderData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40
      });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Generate QR code buffer
      const qrBuffer = await generateQRCodeBuffer(orderData.qrCodeUrl);

      // Calculate grid layout (2 columns x 3 rows = 6 per page)
      const cols = 2;
      const rows = 3;
      const codesPerPage = cols * rows;
      const cellWidth = (A4_WIDTH - 80) / cols;
      const cellHeight = (A4_HEIGHT - 120) / rows;
      const qrDisplaySize = Math.min(cellWidth, cellHeight) - 40;

      const totalPages = Math.ceil(orderData.quantity / codesPerPage);

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          doc.addPage();
        }

        // Page title
        doc.fontSize(16).font('Helvetica-Bold')
          .text(`Order #${orderData.orderNumber} - Page ${page + 1}/${totalPages}`, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica')
          .text(`${orderData.qrCodeName}`, { align: 'center' });
        doc.moveDown(1);

        const startIdx = page * codesPerPage;
        const endIdx = Math.min(startIdx + codesPerPage, orderData.quantity);
        const startY = doc.y;

        let count = 0;
        for (let row = 0; row < rows && (startIdx + count) < endIdx; row++) {
          for (let col = 0; col < cols && (startIdx + count) < endIdx; col++) {
            const x = 40 + (col * cellWidth) + (cellWidth - qrDisplaySize) / 2;
            const y = startY + (row * cellHeight) + (cellHeight - qrDisplaySize) / 2;

            // Draw QR code
            doc.image(qrBuffer, x, y, { width: qrDisplaySize, height: qrDisplaySize });

            // Add QR code name and number below
            doc.fontSize(9).font('Helvetica-Bold')
              .text(`#${startIdx + count + 1}`, x, y + qrDisplaySize + 5, {
                width: qrDisplaySize,
                align: 'center'
              });
            doc.fontSize(8).font('Helvetica')
              .text(orderData.qrCodeName, x, y + qrDisplaySize + 20, {
                width: qrDisplaySize,
                align: 'center'
              });

            count++;
          }
        }

        // Add cut lines for guidance
        doc.save();
        doc.strokeColor('#CCCCCC').dash(5, { space: 10 });
        for (let col = 1; col < cols; col++) {
          const x = 40 + (col * cellWidth);
          doc.moveTo(x, startY).lineTo(x, startY + (rows * cellHeight)).stroke();
        }
        for (let row = 1; row < rows; row++) {
          const y = startY + (row * cellHeight);
          doc.moveTo(40, y).lineTo(A4_WIDTH - 40, y).stroke();
        }
        doc.restore();
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate PDF for an order based on quantity
 */
export async function generateOrderPDF(orderId: string): Promise<Buffer> {
  try {
    // Fetch order details
    const order = await storage.getOrder(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Fetch user and QR code details
    const user = await storage.getUser(order.userId);
    const qrCode = await storage.getQrCode(order.qrCodeId);

    if (!user || !qrCode) {
      throw new Error('User or QR code not found');
    }

    const orderData: OrderData = {
      id: order.id,
      userEmail: user.email,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      qrCodeName: qrCode.name,
      qrCodeUrl: `${process.env.BASE_URL || 'https://snaplist.com'}/qr/${qrCode.shortCode}`,
      quantity: order.quantity,
      shippingAddress: order.shippingAddress,
      orderNumber: order.id.slice(0, 8).toUpperCase()
    };

    // Choose layout based on quantity
    if (orderData.quantity <= SMALL_ORDER_THRESHOLD) {
      return await generateSmallOrderPDF(orderData);
    } else {
      return await generateLargeOrderPDF(orderData);
    }
  } catch (error) {
    console.error('Error generating order PDF:', error);
    throw error;
  }
}

/**
 * Generate delivery address label PDF (for large orders)
 */
export async function generateDeliveryLabelPDF(orderId: string): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await storage.getOrder(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const user = await storage.getUser(order.userId);
      if (!user) {
        throw new Error('User not found');
      }

      const doc = new PDFDocument({
        size: [283.46, 425.20], // 100mm x 150mm shipping label
        margin: 20
      });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Order number
      doc.fontSize(14).font('Helvetica-Bold')
        .text(`Order #${order.id.slice(0, 8).toUpperCase()}`, { align: 'center' });
      doc.moveDown(1);

      // Shipping address
      doc.fontSize(10).font('Helvetica-Bold')
        .text('SHIP TO:');
      doc.moveDown(0.3);

      doc.fontSize(12).font('Helvetica')
        .text(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      doc.fontSize(10)
        .text(order.shippingAddress, { width: 243.46 }); // 263.46 - margins

      doc.moveDown(1);

      // Order details
      doc.fontSize(8).font('Helvetica')
        .text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`)
        .text(`Quantity: ${order.quantity} items`)
        .text(`Total: $${order.total}`);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
