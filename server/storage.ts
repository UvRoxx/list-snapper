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
}

export const storage = new DatabaseStorage();
