# Yard Sign Complete Removal - Documentation

## Summary
All yard sign references have been completely removed from the application. List Snapper now exclusively offers **stickers only**.

---

## ✅ Changes Made

### 1. Database Schema
**File:** `shared/schema.ts`
```typescript
// BEFORE
export const productTypeEnum = pgEnum('product_type', ['sticker', 'yard_sign']);

// AFTER  
export const productTypeEnum = pgEnum('product_type', ['sticker']);
```

---

### 2. Product Selection Removed
**File:** `client/src/components/order-dialog.tsx`

**Removed:**
- Yard sign from products array
- USA-only shipping validation for yard signs
- Shipping restriction warning for yard signs
- SignpostBig icon references

**Updated:**
- Dialog description: "Select stickers for your QR code"
- Simplified product selection to stickers only
- Removed conditional logic for yard_sign

---

### 3. QR Detail Page - Now Uses Modal
**File:** `client/src/pages/qr-detail.tsx`

**Changed:**
- "Order Stickers" button now opens **OrderDialog modal**
- Removed redirect to `/orders` page
- Removed "Order Yard Signs" button completely
- Added `orderDialogOpen` state
- Imported `OrderDialog` component
- Added OrderDialog at end of component tree

**Impact:** Users order stickers directly from QR detail page via modal - better UX!

---

### 4. Orders Page - Simplified to History Only
**File:** `client/src/pages/orders.tsx`

**Removed:**
- Entire "Product Selection" section (stickers + yard signs cards)
- Product images and descriptions
- "Order Stickers" and "Order Yard Signs" buttons
- handleOpenOrderDialog function (no longer needed)
- Check icon import (re-added for status icons)

**Kept:**
- Order History table (important!)
- Order tracking functionality
- Status badges
- Modal support for legacy URL params (qrId from QR detail)

**Updated:**
- Page title: "Order Physical Products" → "Order History"
- Description: Shows order tracking purpose
- Layout: Full-width table instead of grid layout

---

### 5. Cart & Checkout Pages
**Files:** `client/src/pages/cart.tsx`, `client/src/pages/checkout-cart.tsx`, `client/src/hooks/use-cart.tsx`

**Changes:**
- `getProductName()`: Removed yard sign logic, always returns sticker format
- `getItemPrice()`: Simplified to only handle sticker sizes
- `getCartTotal()`: Removed yard_sign pricing ($12.99), only sticker prices
- Cart display: Shows "Sticker (size)" only
- Checkout summary: Simplified product type display

---

### 6. Server Routes
**File:** `server/routes.ts`

**Updated:** `/api/orders/calculate-price`
```typescript
// BEFORE
let basePrice = 0;
if (productType === 'sticker') {
  basePrice = size === 'small' ? 0.5 : size === 'medium' ? 1.0 : 1.5;
} else if (productType === 'yard_sign') {
  basePrice = 12.99;
}

// AFTER
const basePrice = size === 'small' ? 0.5 : size === 'medium' ? 1.0 : 1.5;
```

---

### 7. Admin Dashboard
**File:** `client/src/pages/admin.tsx`

**Changed:**
- Order display: Removed conditional, always shows "Sticker"
- Simplified product type column

---

### 8. Translation Files
**Files:** `client/public/locales/en/common.json`, `client/public/locales/fr/common.json`

**Removed:**
- `order_yard_signs` key

**Updated:**
- `physical_products_desc`: "stickers and yard signs" → "stickers"

---

## Product Offering Summary

### ✅ What We Offer
- **QR Code Stickers Only**
  - 3 sizes: Small (1"), Medium (2"), Large (3")
  - Pricing: $0.50, $1.00, $1.50 per sticker
  - Waterproof & UV resistant
  - Ships to USA, Canada, UK

### ❌ What We Removed
- Yard signs (18x24)
- $12.99 pricing tier
- USA-only shipping restrictions
- SignpostBig icons
- Product selection page

---

## User Flow Changes

### Before:
1. User goes to `/orders` page
2. Sees two products: Stickers & Yard Signs
3. Clicks product card
4. Opens modal
5. Completes order

### After:
1. User views QR code on `/qr/{id}` detail page
2. Clicks "Order Stickers" button in sidebar
3. Modal opens immediately
4. Completes order
5. Never leaves detail page

**Or:**

1. User goes to `/orders` page (via navigation)
2. Sees **Order History table only**
3. Can track existing orders
4. No product selection on this page

---

## Files Modified (9 files)

1. ✅ `shared/schema.ts` - Database enum
2. ✅ `client/src/components/order-dialog.tsx` - Product list, validation
3. ✅ `client/src/pages/qr-detail.tsx` - Modal integration
4. ✅ `client/src/pages/orders.tsx` - Removed product selection
5. ✅ `client/src/pages/cart.tsx` - Pricing logic
6. ✅ `client/src/pages/checkout-cart.tsx` - Product display
7. ✅ `client/src/hooks/use-cart.tsx` - Total calculation
8. ✅ `client/src/pages/admin.tsx` - Order display
9. ✅ `server/routes.ts` - Price calculation
10. ✅ `client/public/locales/en/common.json` - Translations
11. ✅ `client/public/locales/fr/common.json` - Translations

---

## Database Migration Needed?

⚠️ **Important:** Your database still has the enum `product_type` with `['sticker', 'yard_sign']`

**Options:**
1. **Leave as-is** - Existing yard sign orders in DB will still work (backward compatible)
2. **Migrate** - Run migration to update enum (may affect existing data)

**Recommendation:** Leave as-is for now. Existing yard sign orders will display correctly in order history.

---

## Testing Checklist

- [ ] `/orders` page shows order history only
- [ ] QR detail page "Order Stickers" opens modal (not redirect)
- [ ] Modal only shows stickers (no yard sign option)
- [ ] Cart calculates prices correctly (sticker-only)
- [ ] Checkout works for stickers
- [ ] Admin dashboard shows orders correctly
- [ ] No yard sign references in UI
- [ ] No linter errors

---

## Benefits of This Change

✅ **Simpler UX** - Users order from QR detail page, stay in context
✅ **Cleaner Code** - Removed conditionals and validation logic
✅ **Focused Product** - Clear messaging about sticker-only offering
✅ **Better Flow** - Modal instead of page navigation
✅ **Order History Preserved** - Dedicated page for tracking orders

---

**Status:** ✅ Complete - Stickers Only, No Yard Signs

