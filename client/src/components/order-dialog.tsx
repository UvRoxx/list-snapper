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
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, CreditCard, CheckCircle2, Sticker, SignpostBig, Flag, FileImage, Check } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useAuth } from "@/hooks/use-auth";
import type { QrCode } from "@shared/schema";
import QRCodeLib from "qrcode";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeId: string | null;
}

interface CheckoutFormProps {
  qrCode: QrCode;
  productType: string;
  size: string | null;
  quantity: number;
  total: number;
  shippingAddress: ShippingAddress;
  onSuccess: () => void;
}

interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const products = [
  {
    type: "sticker",
    name: "Stickers",
    description: "Weather-resistant vinyl QR stickers",
    icon: Sticker,
  },
  {
    type: "yard_sign",
    name: "Yard Sign",
    description: "18x24 corrugated plastic sign",
    icon: SignpostBig,
  },
  {
    type: "banner",
    name: "Banner",
    description: "Large vinyl banner (coming soon)",
    icon: Flag,
    disabled: true,
  },
  {
    type: "poster",
    name: "Poster",
    description: "High-quality printed poster (coming soon)",
    icon: FileImage,
    disabled: true,
  },
];

const sizeOptions = [
  {
    value: "small",
    label: "Small",
    dimensions: "1\" × 1\"",
    price: 0.50,
  },
  {
    value: "medium",
    label: "Medium",
    dimensions: "2\" × 2\"",
    price: 1.00,
  },
  {
    value: "large",
    label: "Large",
    dimensions: "3\" × 3\"",
    price: 1.50,
  },
];

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
        shippingAddress: JSON.stringify(shippingAddress),
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

export function OrderDialog({ open, onOpenChange, qrCodeId }: OrderDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedQrCodeId, setSelectedQrCodeId] = useState<string | null>(qrCodeId);
  const [productType, setProductType] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>("medium");
  const [quantity, setQuantity] = useState(10);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
  });
  const [saveAddress, setSaveAddress] = useState(false);
  const [total, setTotal] = useState(0);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

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
      setProductType(null);
    }
  }, [qrCodeId, open]);

  useEffect(() => {
    if (user?.savedAddress) {
      try {
        const saved = JSON.parse(user.savedAddress);
        setShippingAddress({ ...saved, country: "United States" });
      } catch (e) {
        console.error("Failed to parse saved address");
      }
    }
  }, [user, open]);

  useEffect(() => {
    if (qrCode) {
      const url = `${window.location.origin}/qr/${qrCode.shortCode}`;
      QRCodeLib.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: qrCode.customColor || "#000000",
          light: qrCode.customBgColor || "#FFFFFF",
        },
      }).then(setQrCodeDataUrl).catch(console.error);
    }
  }, [qrCode]);

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

  const handleSaveAddress = async () => {
    if (saveAddress) {
      try {
        await apiRequest('/api/users/save-address', 'POST', {
          address: JSON.stringify(shippingAddress),
        });
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      } catch (error) {
        console.error("Failed to save address", error);
      }
    }
  };

  const handleCreatePaymentIntent = async () => {
    const { fullName, address, city, state, zipCode } = shippingAddress;
    if (!fullName || !address || !city || !state || !zipCode) {
      toast({
        title: "Complete Address Required",
        description: "Please fill in all address fields",
        variant: "destructive",
      });
      return;
    }

    await handleSaveAddress();

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
      setStep(4);
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
    setProductType(null);
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

  const getProductName = () => {
    const product = products.find(p => p.type === productType);
    return product?.name || "Product";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-order">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            {orderComplete ? "Order Complete" : `Order Physical Products`}
          </DialogTitle>
          <DialogDescription>
            {orderComplete
              ? "Thank you for your order!"
              : qrCode ? `Create an order for ${qrCode.name}` : `Select a product to order`}
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
                {[1, 2, 3, 4].map((num) => (
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
                    {num < 4 && (
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
                <div>
                  <h3 className="font-semibold mb-2">Select QR Code</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose which QR code you'd like to order products for
                  </p>
                </div>
                
                {qrCodes.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No QR Codes Yet</h3>
                    <p className="text-muted-foreground">
                      Create a QR code first before ordering physical products
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {qrCodes.map((qr) => (
                      <Card
                        key={qr.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedQrCodeId === qr.id
                            ? "ring-2 ring-primary"
                            : ""
                        }`}
                        onClick={() => setSelectedQrCodeId(qr.id)}
                        data-testid={`card-qr-${qr.id}`}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{qr.name}</h4>
                            <p className="text-sm text-muted-foreground truncate max-w-md">
                              {qr.destinationUrl}
                            </p>
                          </div>
                          {selectedQrCodeId === qr.id && (
                            <div className="bg-primary text-primary-foreground rounded-full p-1">
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => setStep(1)}
                  className="w-full"
                  disabled={!selectedQrCodeId}
                  data-testid="button-next-qr"
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Step 1: Select Product */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Select Product</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose the physical product you'd like to order
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {products.map((product) => {
                    const Icon = product.icon;
                    return (
                      <Card
                        key={product.type}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          productType === product.type
                            ? "ring-2 ring-primary"
                            : ""
                        } ${product.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() => !product.disabled && setProductType(product.type)}
                        data-testid={`card-product-${product.type}`}
                      >
                        <CardContent className="pt-6 text-center space-y-3">
                          <Icon className="h-12 w-12 mx-auto text-primary" />
                          <div>
                            <h4 className="font-semibold">{product.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {product.description}
                            </p>
                          </div>
                          {productType === product.type && (
                            <div className="flex justify-center">
                              <div className="bg-primary text-primary-foreground rounded-full p-1">
                                <Check className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Button
                  onClick={() => setStep(2)}
                  className="w-full"
                  disabled={!productType}
                  data-testid="button-next-product"
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Step 2: Size & Quantity */}
            {step === 2 && qrCode && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-4">Configure Product</h3>

                    {productType === "sticker" && (
                      <div className="space-y-4 mb-4">
                        <Label>Select Size</Label>
                        <div className="grid grid-cols-1 gap-3">
                          {sizeOptions.map((option) => (
                            <Card
                              key={option.value}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                size === option.value
                                  ? "ring-2 ring-primary"
                                  : ""
                              }`}
                              onClick={() => setSize(option.value)}
                              data-testid={`card-size-${option.value}`}
                            >
                              <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold">{option.label}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {option.dimensions}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-lg font-bold">
                                    ${option.price.toFixed(2)}
                                  </span>
                                  {size === option.value && (
                                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                                      <Check className="h-4 w-4" />
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max="1000"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="mt-2"
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
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Preview</h3>
                    <Card>
                      <CardContent className="pt-6">
                        {qrCodeDataUrl ? (
                          <img
                            src={qrCodeDataUrl}
                            alt="QR Code Preview"
                            className="w-full max-w-[250px] mx-auto"
                            data-testid="img-qr-preview"
                          />
                        ) : (
                          <div className="w-full h-[250px] bg-muted animate-pulse rounded" />
                        )}
                        <div className="mt-4 text-center">
                          <p className="font-medium">{qrCode.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {qrCode.destinationUrl}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

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
                    onClick={() => setStep(3)}
                    className="flex-1"
                    data-testid="button-next-shipping"
                  >
                    Continue to Shipping
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Shipping Address */}
            {step === 3 && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">Shipping Address</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={shippingAddress.fullName}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                          }
                          placeholder="John Doe"
                          data-testid="input-full-name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="address">Street Address</Label>
                        <Input
                          id="address"
                          value={shippingAddress.address}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, address: e.target.value })
                          }
                          placeholder="123 Main St, Apt 4B"
                          data-testid="input-address"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={shippingAddress.city}
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, city: e.target.value })
                            }
                            placeholder="New York"
                            data-testid="input-city"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State/Province</Label>
                          <Input
                            id="state"
                            value={shippingAddress.state}
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, state: e.target.value })
                            }
                            placeholder="NY"
                            data-testid="input-state"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="zipCode">ZIP Code</Label>
                          <Input
                            id="zipCode"
                            value={shippingAddress.zipCode}
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, zipCode: e.target.value })
                            }
                            placeholder="10001"
                            data-testid="input-zip"
                          />
                        </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value="United States"
                            disabled
                            className="bg-muted cursor-not-allowed"
                            data-testid="input-country"
                          />
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
                        <p className="text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
                          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span>Physical product orders are currently available for USA addresses only.</span>
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="saveAddress"
                          checked={saveAddress}
                          onCheckedChange={(checked) => setSaveAddress(checked as boolean)}
                          data-testid="checkbox-save-address"
                        />
                        <Label
                          htmlFor="saveAddress"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Save this address to my profile for future orders
                        </Label>
                      </div>
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
                    onClick={() => setStep(2)}
                    className="flex-1"
                    data-testid="button-back-shipping"
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

            {/* Step 4: Payment */}
            {step === 4 && clientSecret && qrCode && productType && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">Payment</h3>
                    <div className="text-sm text-muted-foreground mb-4 space-y-1">
                      <p><strong>Product:</strong> {getProductName()}</p>
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
                  onClick={() => setStep(3)}
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
