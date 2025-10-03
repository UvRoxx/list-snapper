import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { GoogleAddressInput } from "@/components/google-address-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Package, CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51SD9PpDtmSuWvYXlF0NZB2dZ9QkYM6rvtwJLRWjjn3GTCHhZnCA2k5M1C5Ly8yGxpTk6aP3vqicLPKYTJF6VpoBj00eZwBNC2c';
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

function CheckoutForm({ 
  shippingAddress, 
  total, 
  onSuccess 
}: { 
  shippingAddress: ShippingAddress;
  total: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        // Create orders for all cart items
        const orderPromises = cartItems.map((item) =>
          apiRequest('POST', '/api/orders', {
            qrCodeId: item.qrCodeId,
            productType: item.productType,
            quantity: item.quantity,
            size: item.size,
            total: (item.productType === 'sticker' 
              ? (item.size === 'small' ? 0.5 : item.size === 'medium' ? 1.0 : 1.5) 
              : 12.99) * item.quantity,
            shippingAddress: JSON.stringify(shippingAddress),
            stripePaymentIntentId: paymentIntent.id,
          }).then(res => res.json())
        );

        await Promise.all(orderPromises);
        
        // Clear cart after successful orders
        await clearCart();
        
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!stripe || isProcessing}
        data-testid="button-complete-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay ${total.toFixed(2)}
          </>
        )}
      </Button>
    </form>
  );
}

export default function CheckoutCart() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { cartItems, getCartTotal } = useCart();
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "USA",
  });
  const [saveAddress, setSaveAddress] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const total = getCartTotal();

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0 && !orderComplete) {
      setLocation('/cart');
    }
  }, [cartItems.length, orderComplete, setLocation]);

  const handleContinueToPayment = async () => {
    if (!shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.zipCode) {
      toast({
        title: "Missing Information",
        description: "Please fill in all shipping address fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/create-payment-intent', {
        amount: total.toFixed(2),
      });
      const data = await response.json();
      setClientSecret(data.clientSecret);

      if (saveAddress && user) {
        // Save address to user profile
        await apiRequest('PUT', '/api/auth/profile', {
          savedAddress: JSON.stringify(shippingAddress),
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (orderComplete) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-muted/30">
          <Navigation />
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Order Complete!</h2>
                <p className="text-muted-foreground mb-6">
                  Your order has been placed successfully. You'll receive a confirmation email shortly.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => setLocation('/orders')} data-testid="button-view-orders">
                    View Orders
                  </Button>
                  <Button variant="outline" onClick={() => setLocation('/dashboard')}>
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
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
            <h1 className="text-3xl font-bold mb-2">Checkout</h1>
            <p className="text-muted-foreground">Complete your order</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              {!clientSecret && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <GoogleAddressInput
                      onAddressSelect={(address) => setShippingAddress(address)}
                      initialAddress={shippingAddress}
                    />
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="saveAddress"
                        checked={saveAddress}
                        onCheckedChange={(checked) => setSaveAddress(checked as boolean)}
                        data-testid="checkbox-save-address"
                      />
                      <label htmlFor="saveAddress" className="text-sm cursor-pointer">
                        Save this address for future orders
                      </label>
                    </div>
                    <Button
                      onClick={handleContinueToPayment}
                      className="w-full"
                      disabled={isLoading}
                      data-testid="button-continue-payment"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Continue to Payment"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Payment */}
              {clientSecret && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CheckoutForm
                        shippingAddress={shippingAddress}
                        total={total}
                        onSuccess={() => setOrderComplete(true)}
                      />
                    </Elements>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cartItems.map((item) => {
                      const itemPrice = item.productType === 'sticker'
                        ? (item.size === 'small' ? 0.5 : item.size === 'medium' ? 1.0 : 1.5)
                        : 12.99;
                      return (
                        <div key={item.id} className="flex justify-between text-sm">
                          <div className="flex-1">
                            <div className="font-medium">{item.qrCode.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.productType === 'sticker' ? `Sticker (${item.size})` : 'Yard Sign'} × {item.quantity}
                            </div>
                          </div>
                          <div className="font-medium">
                            ${(itemPrice * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-muted-foreground">Calculated after checkout</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold">${total.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

