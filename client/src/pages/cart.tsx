import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCart } from "@/hooks/use-cart";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package } from "lucide-react";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { cartItems, cartCount, updateQuantity, removeItem, clearCart, getCartTotal, isLoading } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleQuantityChange = async (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity > 0) {
      await updateQuantity(itemId, newQuantity);
    }
  };

  const handleCheckout = () => {
    console.log('Navigating to checkout-cart with', cartItems.length, 'items');
    setIsCheckingOut(true);
    setLocation("/checkout-cart");
  };

  const getProductName = (productType: string, size?: string | null) => {
    const sizeLabel = size === "small" ? '1"' : size === "medium" ? '2"' : '3"';
    return `QR Stickers (${sizeLabel})`;
  };

  const getItemPrice = (productType: string, size?: string | null) => {
    return size === "small" ? 0.5 : size === "medium" ? 1.0 : 1.5;
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-muted/30">
          <Navigation />
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        
        <div className="bg-background border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="text-cart-title">Shopping Cart</h1>
            <p className="text-muted-foreground">Review your items before checkout</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {cartItems.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Your Cart is Empty</h3>
                <p className="text-muted-foreground mb-6">
                  Add some QR code products to get started
                </p>
                <Link href="/orders">
                  <Button data-testid="button-browse-products">
                    Browse Products
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Cart Items ({cartCount})</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => clearCart()}
                    data-testid="button-clear-cart"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cart
                  </Button>
                </div>

                {cartItems.map((item) => {
                  const itemPrice = getItemPrice(item.productType, item.size);
                  const itemTotal = itemPrice * item.quantity;

                  return (
                    <Card key={item.id} data-testid={`cart-item-${item.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* QR Code Preview */}
                          <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold mb-1">{item.qrCode.name}</h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {getProductName(item.productType, item.size)}
                                </p>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="text-xs text-muted-foreground truncate max-w-xs cursor-help">
                                        {item.qrCode.destinationUrl}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-sm break-all">
                                      <p>{item.qrCode.destinationUrl}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(item.id)}
                                data-testid={`button-remove-${item.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                              {/* Quantity Controls */}
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                                  data-testid={`button-decrease-${item.id}`}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-12 text-center font-medium">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                                  data-testid={`button-increase-${item.id}`}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* Price */}
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">
                                  ${itemPrice.toFixed(2)} × {item.quantity}
                                </div>
                                <div className="font-semibold">
                                  ${itemTotal.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-8">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${getCartTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="text-muted-foreground">Calculated at checkout</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold">${getCartTotal().toFixed(2)}</span>
                    </div>

                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleCheckout}
                      disabled={isCheckingOut}
                      data-testid="button-checkout"
                    >
                      {isCheckingOut ? "Processing..." : (
                        <>
                          Proceed to Checkout
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <Link href="/orders">
                      <Button variant="outline" className="w-full" data-testid="button-continue-shopping">
                        Continue Shopping
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

