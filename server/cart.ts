import { db } from "../server/db";
import { cartItems } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { InsertCartItem, CartItem } from "@shared/schema";

export const storage = {
  // Get all cart items for a user with QR code details
  async getUserCartItems(userId: string): Promise<any[]> {
    const items = await db.query.cartItems.findMany({
      where: eq(cartItems.userId, userId),
      with: {
        qrCode: true,
      },
      orderBy: (cartItems, { desc }) => [desc(cartItems.createdAt)],
    });
    return items;
  },

  // Add item to cart
  async addToCart(data: InsertCartItem & { userId: string }): Promise<CartItem> {
    // Check if item already exists in cart
    const existing = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.userId, data.userId),
        eq(cartItems.qrCodeId, data.qrCodeId),
        eq(cartItems.productType, data.productType),
        eq(cartItems.size, data.size || "")
      ),
    });

    if (existing) {
      // Update quantity if item exists
      const [updated] = await db
        .update(cartItems)
        .set({ 
          quantity: existing.quantity + data.quantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existing.id))
        .returning();
      return updated;
    }

    // Create new cart item
    const [item] = await db.insert(cartItems).values(data).returning();
    return item;
  },

  // Update cart item quantity
  async updateCartItemQuantity(itemId: string, userId: string, quantity: number): Promise<CartItem | null> {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      await this.removeFromCart(itemId, userId);
      return null;
    }

    const [updated] = await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)))
      .returning();
    return updated;
  },

  // Remove item from cart
  async removeFromCart(itemId: string, userId: string): Promise<void> {
    await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)));
  },

  // Clear entire cart for user
  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  },

  // Get cart item count for user
  async getCartItemCount(userId: string): Promise<number> {
    const items = await db.query.cartItems.findMany({
      where: eq(cartItems.userId, userId),
    });
    return items.reduce((total, item) => total + item.quantity, 0);
  },
};

