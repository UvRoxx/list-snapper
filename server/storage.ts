import { 
  users, 
  qrCodes, 
  qrCodeScans,
  orders,
  membershipTiers,
  userMemberships,
  orderStatusHistory,
  type User, 
  type InsertUser,
  type QrCode,
  type InsertQrCode,
  type QrCodeScan,
  type Order,
  type InsertOrder,
  type MembershipTier,
  type UserMembership
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;

  // QR Code methods
  getUserQrCodes(userId: string): Promise<QrCode[]>;
  getQrCode(id: string): Promise<QrCode | undefined>;
  getQrCodeByShortCode(shortCode: string): Promise<QrCode | undefined>;
  createQrCode(qrCode: InsertQrCode & { userId: string; shortCode: string }): Promise<QrCode>;
  updateQrCode(id: string, updates: Partial<InsertQrCode>): Promise<QrCode>;
  deleteQrCode(id: string): Promise<void>;
  incrementQrCodeScans(id: string): Promise<void>;

  // QR Code Scan methods
  createQrCodeScan(scan: Omit<QrCodeScan, 'id' | 'scannedAt'>): Promise<QrCodeScan>;
  getQrCodeScans(qrCodeId: string): Promise<QrCodeScan[]>;
  getQrCodeAnalytics(qrCodeId: string): Promise<any>;
  getUserAnalytics(userId: string, timeRange?: string): Promise<any>;

  // Membership methods
  getMembershipTiers(): Promise<MembershipTier[]>;
  getUserMembership(userId: string): Promise<UserMembership | undefined>;
  createUserMembership(membership: Omit<UserMembership, 'id' | 'createdAt'>): Promise<UserMembership>;
  updateUserMembership(userId: string, updates: Partial<UserMembership>): Promise<UserMembership>;

  // Order methods
  getUserOrders(userId: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder & { userId: string }): Promise<Order>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order>;

  // Admin methods
  getAllUsers(): Promise<(User & { membershipTier?: string })[]>;
  getAllQrCodes(): Promise<(QrCode & { userEmail?: string })[]>;
  getAllOrders(): Promise<(Order & { userEmail?: string; qrCodeName?: string })[]>;
  getPlatformStats(): Promise<{
    totalUsers: number;
    totalQrCodes: number;
    totalScans: number;
    totalOrders: number;
    revenueThisMonth: number;
  }>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserQrCodes(userId: string): Promise<QrCode[]> {
    return await db
      .select()
      .from(qrCodes)
      .where(eq(qrCodes.userId, userId))
      .orderBy(desc(qrCodes.createdAt));
  }

  async getQrCode(id: string): Promise<QrCode | undefined> {
    const [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.id, id));
    return qrCode || undefined;
  }

  async getQrCodeByShortCode(shortCode: string): Promise<QrCode | undefined> {
    const [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.shortCode, shortCode));
    return qrCode || undefined;
  }

  async createQrCode(qrCode: InsertQrCode & { userId: string; shortCode: string }): Promise<QrCode> {
    const [newQrCode] = await db
      .insert(qrCodes)
      .values(qrCode)
      .returning();
    return newQrCode;
  }

  async updateQrCode(id: string, updates: Partial<InsertQrCode>): Promise<QrCode> {
    const [qrCode] = await db
      .update(qrCodes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(qrCodes.id, id))
      .returning();
    return qrCode;
  }

  async deleteQrCode(id: string): Promise<void> {
    await db.delete(qrCodes).where(eq(qrCodes.id, id));
  }

  async incrementQrCodeScans(id: string): Promise<void> {
    await db
      .update(qrCodes)
      .set({ 
        scanCount: sql`${qrCodes.scanCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(qrCodes.id, id));
  }

  async createQrCodeScan(scan: Omit<QrCodeScan, 'id' | 'scannedAt'>): Promise<QrCodeScan> {
    const [newScan] = await db
      .insert(qrCodeScans)
      .values(scan)
      .returning();
    return newScan;
  }

  async getQrCodeScans(qrCodeId: string): Promise<QrCodeScan[]> {
    return await db
      .select()
      .from(qrCodeScans)
      .where(eq(qrCodeScans.qrCodeId, qrCodeId))
      .orderBy(desc(qrCodeScans.scannedAt));
  }

  async getQrCodeAnalytics(qrCodeId: string): Promise<any> {
    const scans = await this.getQrCodeScans(qrCodeId);
    
    return {
      totalScans: scans.length,
      uniqueVisitors: new Set(scans.map(s => s.ipAddress)).size,
      deviceBreakdown: scans.reduce((acc, scan) => {
        const device = scan.deviceType || 'Unknown';
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      locationBreakdown: scans.reduce((acc, scan) => {
        const country = scan.country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      browserBreakdown: scans.reduce((acc, scan) => {
        const browser = scan.browser || 'Unknown';
        acc[browser] = (acc[browser] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async getUserAnalytics(userId: string, timeRange?: string): Promise<any> {
    // Get all user's QR codes
    const userQrCodes = await this.getUserQrCodes(userId);
    const qrCodeIds = userQrCodes.map(qr => qr.id);
    
    if (qrCodeIds.length === 0) {
      return {
        totalScans: 0,
        uniqueVisitors: 0,
        avgDailyScans: 0,
        peakHour: 'N/A',
        deviceBreakdown: {},
        browserBreakdown: {},
        osBreakdown: {},
        locationBreakdown: {},
        scanTimeSeries: [],
      };
    }

    // Calculate date range
    let dateFilter = sql`1=1`;
    const now = new Date();
    if (timeRange === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = sql`${qrCodeScans.scannedAt} >= ${sevenDaysAgo.toISOString()}`;
    } else if (timeRange === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = sql`${qrCodeScans.scannedAt} >= ${thirtyDaysAgo.toISOString()}`;
    } else if (timeRange === '90days') {
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      dateFilter = sql`${qrCodeScans.scannedAt} >= ${ninetyDaysAgo.toISOString()}`;
    }

    // Get all scans for user's QR codes
    const scans = await db
      .select()
      .from(qrCodeScans)
      .where(and(
        sql`${qrCodeScans.qrCodeId} IN (${sql.join(qrCodeIds.map(id => sql`${id}`), sql`, `)})`,
        dateFilter
      ))
      .orderBy(desc(qrCodeScans.scannedAt));

    // Calculate unique visitors
    const uniqueIps = new Set(scans.map(s => s.ipAddress).filter(ip => ip !== null));

    // Device breakdown
    const deviceBreakdown = scans.reduce((acc, scan) => {
      const device = scan.deviceType || 'Unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Browser breakdown
    const browserBreakdown = scans.reduce((acc, scan) => {
      const browser = scan.browser || 'Unknown';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // OS breakdown
    const osBreakdown = scans.reduce((acc, scan) => {
      const os = scan.operatingSystem || 'Unknown';
      acc[os] = (acc[os] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Location breakdown
    const locationBreakdown = scans.reduce((acc, scan) => {
      const country = scan.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Time series data (scans by day)
    const scansByDate = scans.reduce((acc, scan) => {
      const date = new Date(scan.scannedAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const scanTimeSeries = Object.entries(scansByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Peak hour calculation
    const hourCounts = scans.reduce((acc, scan) => {
      const hour = new Date(scan.scannedAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    let peakHour = 'N/A';
    if (Object.keys(hourCounts).length > 0) {
      const maxHour = Object.entries(hourCounts).reduce((max, [hour, count]) => 
        count > max.count ? { hour: parseInt(hour), count } : max,
        { hour: 0, count: 0 }
      );
      peakHour = `${maxHour.hour}:00 - ${maxHour.hour + 1}:00`;
    }

    // Calculate average daily scans based on actual time range
    let days = 30;
    if (timeRange === '7days') {
      days = 7;
    } else if (timeRange === '30days') {
      days = 30;
    } else if (timeRange === '90days') {
      days = 90;
    } else if (scans.length > 0) {
      // For "all" time or custom ranges, calculate from actual data span
      const timestamps = scans.map(s => new Date(s.scannedAt).getTime());
      const minTime = Math.min(...timestamps);
      const maxTime = Math.max(...timestamps);
      const daysDiff = (maxTime - minTime) / (1000 * 60 * 60 * 24);
      days = Math.max(1, Math.ceil(daysDiff));
    }
    
    const avgDailyScans = days > 0 ? Math.round(scans.length / days) : 0;

    return {
      totalScans: scans.length,
      uniqueVisitors: uniqueIps.size,
      avgDailyScans,
      peakHour,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
      locationBreakdown,
      scanTimeSeries,
    };
  }

  async getMembershipTiers(): Promise<MembershipTier[]> {
    return await db.select().from(membershipTiers);
  }

  async getUserMembership(userId: string): Promise<UserMembership | undefined> {
    const [membership] = await db
      .select()
      .from(userMemberships)
      .where(and(
        eq(userMemberships.userId, userId),
        eq(userMemberships.isActive, true)
      ));
    return membership || undefined;
  }

  async createUserMembership(membership: Omit<UserMembership, 'id' | 'createdAt'>): Promise<UserMembership> {
    const [newMembership] = await db
      .insert(userMemberships)
      .values(membership)
      .returning();
    return newMembership;
  }

  async updateUserMembership(userId: string, updates: Partial<UserMembership>): Promise<UserMembership> {
    const [membership] = await db
      .update(userMemberships)
      .set(updates)
      .where(eq(userMemberships.userId, userId))
      .returning();
    return membership;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(order: InsertOrder & { userId: string }): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();
    return newOrder;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async getAllUsers(): Promise<(User & { membershipTier?: string })[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        password: sql<string>`''`.as('password'),
        firstName: users.firstName,
        lastName: users.lastName,
        company: users.company,
        isAdmin: users.isAdmin,
        stripeCustomerId: users.stripeCustomerId,
        stripeSubscriptionId: users.stripeSubscriptionId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        membershipTier: userMemberships.tierName,
      })
      .from(users)
      .leftJoin(userMemberships, and(
        eq(users.id, userMemberships.userId),
        eq(userMemberships.isActive, true)
      ))
      .orderBy(desc(users.createdAt));
    
    return result;
  }

  async getAllQrCodes(): Promise<(QrCode & { userEmail?: string })[]> {
    const result = await db
      .select({
        id: qrCodes.id,
        userId: qrCodes.userId,
        name: qrCodes.name,
        shortCode: qrCodes.shortCode,
        destinationUrl: qrCodes.destinationUrl,
        isActive: qrCodes.isActive,
        customColor: qrCodes.customColor,
        customBgColor: qrCodes.customBgColor,
        logoUrl: qrCodes.logoUrl,
        scanCount: qrCodes.scanCount,
        createdAt: qrCodes.createdAt,
        updatedAt: qrCodes.updatedAt,
        userEmail: users.email,
      })
      .from(qrCodes)
      .leftJoin(users, eq(qrCodes.userId, users.id))
      .orderBy(desc(qrCodes.createdAt));
    
    return result;
  }

  async getAllOrders(): Promise<(Order & { userEmail?: string; qrCodeName?: string })[]> {
    const result = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        qrCodeId: orders.qrCodeId,
        productType: orders.productType,
        quantity: orders.quantity,
        size: orders.size,
        total: orders.total,
        status: orders.status,
        stripePaymentIntentId: orders.stripePaymentIntentId,
        printifyOrderId: orders.printifyOrderId,
        shippingAddress: orders.shippingAddress,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        userEmail: users.email,
        qrCodeName: qrCodes.name,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(qrCodes, eq(orders.qrCodeId, qrCodes.id))
      .orderBy(desc(orders.createdAt));
    
    return result;
  }

  async getPlatformStats(): Promise<{
    totalUsers: number;
    totalQrCodes: number;
    totalScans: number;
    totalOrders: number;
    revenueThisMonth: number;
  }> {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [qrCodeCount] = await db.select({ count: count() }).from(qrCodes);
    const [scanCount] = await db.select({ count: count() }).from(qrCodeScans);
    const [orderCount] = await db.select({ count: count() }).from(orders);

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const monthlyOrders = await db
      .select({ total: orders.total })
      .from(orders)
      .where(
        and(
          eq(orders.status, 'delivered'),
          sql`${orders.createdAt} >= ${firstDayOfMonth}`
        )
      );

    const revenueThisMonth = monthlyOrders.reduce((sum, order) => 
      sum + parseFloat(order.total?.toString() || '0'), 0
    );

    return {
      totalUsers: userCount.count,
      totalQrCodes: qrCodeCount.count,
      totalScans: scanCount.count,
      totalOrders: orderCount.count,
      revenueThisMonth,
    };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
}

export const storage = new DatabaseStorage();
