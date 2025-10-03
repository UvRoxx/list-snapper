import { db } from "./db";
import { membershipTiers } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedMembershipTiers() {
  console.log("🌱 Seeding membership tiers...");

  const tiers = [
    {
      name: 'FREE' as const,
      displayName: 'Free',
      price: '0.00',
      maxQrCodes: 5,
      hasAnalytics: false,
      hasCustomBranding: false,
      hasApiAccess: false,
      hasWhiteLabel: false,
      stripePriceId: null,
    },
    {
      name: 'STANDARD' as const,
      displayName: 'Standard',
      price: '19.00',
      maxQrCodes: 50,
      hasAnalytics: true,
      hasCustomBranding: true,
      hasApiAccess: false,
      hasWhiteLabel: false,
      stripePriceId: process.env.STRIPE_STANDARD_PRICE_ID,
    },
    {
      name: 'PRO' as const,
      displayName: 'Pro',
      price: '49.00',
      maxQrCodes: null, // unlimited
      hasAnalytics: true,
      hasCustomBranding: true,
      hasApiAccess: true,
      hasWhiteLabel: true,
      stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    },
  ];

  for (const tier of tiers) {
    try {
      // Check if tier already exists
      const existing = await db
        .select()
        .from(membershipTiers)
        .where(eq(membershipTiers.name, tier.name))
        .limit(1);

      if (existing.length === 0) {
        // Create tier
        await db.insert(membershipTiers).values(tier);
        console.log(`✅ Created ${tier.name} tier`);
      } else {
        // Update existing tier with latest Stripe price IDs
        await db
          .update(membershipTiers)
          .set({ 
            stripePriceId: tier.stripePriceId,
            price: tier.price,
            displayName: tier.displayName,
            maxQrCodes: tier.maxQrCodes,
            hasAnalytics: tier.hasAnalytics,
            hasCustomBranding: tier.hasCustomBranding,
            hasApiAccess: tier.hasApiAccess,
            hasWhiteLabel: tier.hasWhiteLabel,
          })
          .where(eq(membershipTiers.name, tier.name));
        console.log(`✅ Updated ${tier.name} tier`);
      }
    } catch (error) {
      console.error(`❌ Error seeding ${tier.name} tier:`, error);
    }
  }

  console.log("✅ Membership tiers seeded successfully!");
}

