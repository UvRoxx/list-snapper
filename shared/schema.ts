import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal, pgEnum, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const membershipTierEnum = pgEnum('membership_tier', ['FREE', 'STANDARD', 'PRO']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled']);
export const productTypeEnum = pgEnum('product_type', ['sticker', 'yard_sign']);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  company: text("company"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const membershipTiers = pgTable("membership_tiers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: membershipTierEnum("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  maxQrCodes: integer("max_qr_codes"),
  hasAnalytics: boolean("has_analytics").default(false),
  hasCustomBranding: boolean("has_custom_branding").default(false),
  hasApiAccess: boolean("has_api_access").default(false),
  hasWhiteLabel: boolean("has_white_label").default(false),
  stripePriceId: text("stripe_price_id"),
});

export const userMemberships = pgTable("user_memberships", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tierName: membershipTierEnum("tier_name").notNull(),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const qrCodes = pgTable("qr_codes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  shortCode: text("short_code").notNull().unique(),
  destinationUrl: text("destination_url").notNull(),
  isActive: boolean("is_active").default(true),
  customColor: text("custom_color").default("#000000"),
  customBgColor: text("custom_bg_color").default("#FFFFFF"),
  logoUrl: text("logo_url"),
  scanCount: integer("scan_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const qrCodeScans = pgTable("qr_code_scans", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  qrCodeId: uuid("qr_code_id").references(() => qrCodes.id, { onDelete: "cascade" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  country: text("country"),
  city: text("city"),
  deviceType: text("device_type"),
  browser: text("browser"),
  operatingSystem: text("operating_system"),
  scannedAt: timestamp("scanned_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  qrCodeId: uuid("qr_code_id").references(() => qrCodes.id).notNull(),
  productType: productTypeEnum("product_type").notNull(),
  quantity: integer("quantity").notNull(),
  size: text("size"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").default('pending'),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  printifyOrderId: text("printify_order_id"),
  shippingAddress: text("shipping_address").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderStatusHistory = pgTable("order_status_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  status: orderStatusEnum("status").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  qrCodes: many(qrCodes),
  orders: many(orders),
  membership: one(userMemberships),
}));

export const qrCodesRelations = relations(qrCodes, ({ one, many }) => ({
  user: one(users, {
    fields: [qrCodes.userId],
    references: [users.id],
  }),
  scans: many(qrCodeScans),
  orders: many(orders),
}));

export const qrCodeScansRelations = relations(qrCodeScans, ({ one }) => ({
  qrCode: one(qrCodes, {
    fields: [qrCodeScans.qrCodeId],
    references: [qrCodes.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  qrCode: one(qrCodes, {
    fields: [orders.qrCodeId],
    references: [qrCodes.id],
  }),
  statusHistory: many(orderStatusHistory),
}));

export const userMembershipsRelations = relations(userMemberships, ({ one }) => ({
  user: one(users, {
    fields: [userMemberships.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  company: true,
});

export const insertQrCodeSchema = createInsertSchema(qrCodes).pick({
  name: true,
  destinationUrl: true,
  customColor: true,
  customBgColor: true,
  logoUrl: true,
  isActive: true,
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  qrCodeId: true,
  productType: true,
  quantity: true,
  size: true,
  total: true,
  shippingAddress: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertQrCode = z.infer<typeof insertQrCodeSchema>;
export type QrCode = typeof qrCodes.$inferSelect;
export type QrCodeScan = typeof qrCodeScans.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type MembershipTier = typeof membershipTiers.$inferSelect;
export type UserMembership = typeof userMemberships.$inferSelect;
