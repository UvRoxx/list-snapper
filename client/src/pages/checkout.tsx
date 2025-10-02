import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, Crown, ArrowLeft } from "lucide-react";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ tier }: { tier: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "You are now subscribed!",
        });
        setLocation('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="form-checkout">
      <div className="mb-6">
        <PaymentElement />
      </div>
      <Button 
        type="submit"
        className="w-full"
        disabled={!stripe || !elements || isProcessing}
        data-testid="button-complete-payment"
      >
        {isProcessing ? "Processing..." : `Subscribe to ${tier.toUpperCase()}`}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);

  const tier = params.tier || 'standard';

  const tierDetails = {
    standard: {
      name: 'STANDARD',
      price: '$4.99',
      features: [
        '50 QR codes maximum',
        'Full analytics dashboard', 
        'Custom QR design options',
        'Priority support',
        'Export analytics data'
      ]
    },
    pro: {
      name: 'PRO',
      price: '$9.99',
      features: [
        'Unlimited QR codes',
        'Advanced analytics',
        'API access',
        'White-label options',
        'Dedicated support'
      ]
    }
  };

  const currentTier = tierDetails[tier as keyof typeof tierDetails] || tierDetails.standard;

  useEffect(() => {
    const createSubscription = async () => {
      try {
        const response = await apiRequest("POST", "/api/subscriptions/create-checkout", {
          tierName: tier.toUpperCase()
        });
        const data = await response.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error('No client secret received');
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to initialize checkout",
          variant: "destructive"
        });
        setLocation('/pricing');
      } finally {
        setLoading(false);
      }
    };

    createSubscription();
  }, [tier, toast, setLocation]);

  if (loading || !clientSecret) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
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
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/pricing')}
            className="mb-8"
            data-testid="button-back-pricing"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pricing
          </Button>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Plan Summary */}
            <Card data-testid="card-plan-summary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Plan Summary</CardTitle>
                  <Badge className="bg-primary/10 text-primary">
                    {currentTier.name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-card rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-3xl font-bold mb-1">
                        {currentTier.price}
                        <span className="text-lg text-muted-foreground">/month</span>
                      </div>
                      <p className="text-muted-foreground">{currentTier.name} Plan</p>
                    </div>
                    <Crown className="h-12 w-12 text-primary" />
                  </div>
                  
                  <div className="space-y-3">
                    {currentTier.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">• Cancel anytime</p>
                  <p className="mb-2">• 14-day free trial</p>
                  <p>• No setup fees</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card data-testid="card-payment-form">
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Elements 
                  stripe={stripePromise} 
                  options={{ clientSecret }}
                >
                  <CheckoutForm tier={tier} />
                </Elements>
                
                <div className="mt-6 text-xs text-muted-foreground text-center">
                  <p>By subscribing, you agree to our Terms of Service and Privacy Policy.</p>
                  <p className="mt-2">Your payment is secured by Stripe.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
