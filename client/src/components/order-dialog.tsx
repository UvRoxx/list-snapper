import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, CreditCard, CheckCircle2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import type { QrCode } from "@shared/schema";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeId: string | null;
  productType: "sticker" | "yard_sign" | null;
}

interface CheckoutFormProps {
  qrCode: QrCode;
  productType: "sticker" | "yard_sign";
  size: string;
  quantity: number;
  total: number;
  shippingAddress: string;
  onSuccess: () => void;
}

function CheckoutForm({ qrCode, productType, size, quantity, total, shippingAddress, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const createOrderMutation = useMutation({
    mutationFn: async (paymentIntentId: string) => {
      return await apiRequest('/api/orders', 'POST', {
        qrCodeId: qrCode.id,
        productType,
        quantity,
        size,
        total: total.toFixed(2),
        shippingAddress,
        stripePaymentIntentId: paymentIntentId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/orders",
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        await createOrderMutation.mutateAsync(paymentIntent.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
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

export function OrderDialog({ open, onOpenChange, qrCodeId, productType }: OrderDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(qrCodeId ? 1 : 0);
  const [selectedQrCodeId, setSelectedQrCodeId] = useState<string | null>(qrCodeId);
  const [size, setSize] = useState("medium");
  const [quantity, setQuantity] = useState(10);
  const [shippingAddress, setShippingAddress] = useState("");
  const [total, setTotal] = useState(0);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);

  const { data: qrCodes = [] } = useQuery<QrCode[]>({
    queryKey: ['/api/qr-codes'],
    enabled: open && !qrCodeId,
  });

  const { data: qrCode } = useQuery<QrCode>({
    queryKey: [`/api/qr-codes/${selectedQrCodeId}`],
    enabled: !!selectedQrCodeId && open,
  });

  useEffect(() => {
    if (qrCodeId) {
      setSelectedQrCodeId(qrCodeId);
      setStep(1);
    } else {
      setSelectedQrCodeId(null);
      setStep(0);
    }
  }, [qrCodeId, open]);

  useEffect(() => {
    if (open && productType && quantity > 0 && selectedQrCodeId) {
      fetchPrice();
    }
  }, [open, productType, size, quantity, selectedQrCodeId]);

  const fetchPrice = async () => {
    try {
      const response = await fetch('/api/orders/calculate-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({
          productType,
          size,
          quantity,
        }),
      });
      const data = await response.json();
      setTotal(parseFloat(data.total));
    } catch (error) {
      console.error('Error calculating price:', error);
    }
  };

  const handleCreatePaymentIntent = async () => {
    if (!shippingAddress.trim()) {
      toast({
        title: "Shipping Address Required",
        description: "Please enter your shipping address",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({
          amount: total.toFixed(2),
        }),
      });
      const data = await response.json();
      setClientSecret(data.clientSecret);
      setStep(3);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setStep(qrCodeId ? 1 : 0);
    setSelectedQrCodeId(qrCodeId);
    setClientSecret(null);
    setOrderComplete(false);
    onOpenChange(false);
  };

  const handleOrderSuccess = () => {
    setOrderComplete(true);
    toast({
      title: "Order Placed Successfully!",
      description: "Your order has been received and is being processed.",
    });
  };

  if (!productType) {
    return null;
  }

  const productName = productType === "sticker" ? "QR Code Stickers" : "QR Code Yard Sign";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-order">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            {orderComplete ? "Order Complete" : `Order ${productName}`}
          </DialogTitle>
          <DialogDescription>
            {orderComplete
              ? "Thank you for your order!"
              : qrCode ? `Complete your order for ${qrCode.name}` : `Order ${productName}`}
          </DialogDescription>
        </DialogHeader>

        {orderComplete ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold">Order Confirmed!</h3>
            <p className="text-muted-foreground">
              We'll send you an email with tracking information once your order ships.
            </p>
            <Button onClick={handleClose} className="mt-4" data-testid="button-close-order">
              View Orders
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress Steps */}
            {step > 0 && (
              <div className="flex items-center justify-center space-x-2">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        step >= num
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {num}
                    </div>
                    {num < 3 && (
                      <div
                        className={`w-12 h-0.5 ${
                          step > num ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Step 0: Select QR Code */}
            {step === 0 && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">Select QR Code</h3>
                    {qrCodes.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No QR codes available. Create a QR code first.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="qrCode">Choose QR Code</Label>
                        <Select
                          value={selectedQrCodeId || ""}
                          onValueChange={setSelectedQrCodeId}
                        >
                          <SelectTrigger id="qrCode" data-testid="select-qr-code">
                            <SelectValue placeholder="Select a QR code" />
                          </SelectTrigger>
                          <SelectContent>
                            {qrCodes.map((qr) => (
                              <SelectItem key={qr.id} value={qr.id}>
                                {qr.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button
                  onClick={() => setStep(1)}
                  className="w-full"
                  disabled={!selectedQrCodeId}
                  data-testid="button-next-step"
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Step 1: Product Configuration */}
            {step === 1 && qrCode && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">Product Configuration</h3>

                    {productType === "sticker" && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="size">Size</Label>
                          <Select value={size} onValueChange={setSize}>
                            <SelectTrigger id="size" data-testid="select-size">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">1" - Small ($0.50 each)</SelectItem>
                              <SelectItem value="medium">2" - Medium ($1.00 each)</SelectItem>
                              <SelectItem value="large">3" - Large ($1.50 each)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max="1000"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        data-testid="input-quantity"
                      />
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total:</span>
                      <span className="text-2xl font-bold" data-testid="text-total">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={() => setStep(2)}
                  className="w-full"
                  data-testid="button-next-step"
                >
                  Continue to Shipping
                </Button>
              </div>
            )}

            {/* Step 2: Shipping Address */}
            {step === 2 && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">Shipping Address</h3>
                    <div className="space-y-2">
                      <Label htmlFor="address">Full Address</Label>
                      <textarea
                        id="address"
                        className="w-full min-h-[120px] px-3 py-2 border rounded-md"
                        placeholder="Enter your complete shipping address including street, city, state, and ZIP code"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        data-testid="textarea-shipping-address"
                      />
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total:</span>
                      <span className="text-2xl font-bold">${total.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                    data-testid="button-back"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleCreatePaymentIntent}
                    className="flex-1"
                    data-testid="button-continue-payment"
                  >
                    Continue to Payment
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && clientSecret && qrCode && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">Payment</h3>
                    <div className="text-sm text-muted-foreground mb-4 space-y-1">
                      <p><strong>Product:</strong> {productName}</p>
                      <p><strong>Quantity:</strong> {quantity}</p>
                      {productType === "sticker" && <p><strong>Size:</strong> {size}</p>}
                      <p><strong>Total:</strong> ${total.toFixed(2)}</p>
                    </div>

                    <Separator className="my-4" />

                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CheckoutForm
                        qrCode={qrCode}
                        productType={productType}
                        size={size}
                        quantity={quantity}
                        total={total}
                        shippingAddress={shippingAddress}
                        onSuccess={handleOrderSuccess}
                      />
                    </Elements>
                  </CardContent>
                </Card>

                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="w-full"
                  data-testid="button-back-payment"
                >
                  Back
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
