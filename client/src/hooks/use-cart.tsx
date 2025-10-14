import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import type { CartItem, QrCode } from "@shared/schema";

interface CartItemWithQrCode extends CartItem {
  qrCode: QrCode;
}

interface CartContextType {
  cartItems: CartItemWithQrCode[];
  cartCount: number;
  isLoading: boolean;
  addToCart: (item: { qrCodeId: string; productType: string; quantity: number; size?: string }) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithQrCode[]>({
    queryKey: ['/api/cart'],
    enabled: !!user,
  });

  const addToCartMutation = useMutation({
    mutationFn: async (item: { qrCodeId: string; productType: string; quantity: number; size?: string }) => {
      console.log('useCart: Adding to cart mutation', item);
      try {
        const response = await apiRequest('POST', '/api/cart', item);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add to cart');
        }
        const data = await response.json();
        console.log('useCart: Successfully added to cart', data);
        return data;
      } catch (error: any) {
        console.error('useCart: Add to cart error', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
      toast({
        title: "Added to Cart",
        description: "Item has been added to your cart",
      });
    },
    onError: (error: any) => {
      console.error('useCart: onError called', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const response = await apiRequest('PUT', `/api/cart/${itemId}`, { quantity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update quantity",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest('DELETE', `/api/cart/${itemId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Removed from Cart",
        description: "Item has been removed from your cart",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove item",
        variant: "destructive",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/cart');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear cart",
        variant: "destructive",
      });
    },
  });

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const basePrice = item.size === 'small' ? 0.5 : item.size === 'medium' ? 1.0 : 1.5;
      return total + (basePrice * item.quantity);
    }, 0);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        isLoading,
        addToCart: (item) => addToCartMutation.mutateAsync(item),
        updateQuantity: (itemId, quantity) => updateQuantityMutation.mutateAsync({ itemId, quantity }),
        removeItem: (itemId) => removeItemMutation.mutateAsync(itemId),
        clearCart: () => clearCartMutation.mutateAsync(),
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

