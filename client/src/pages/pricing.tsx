import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X } from "lucide-react";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4" data-testid="text-pricing-title">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground">Choose the perfect plan for your needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* FREE Plan */}
            <Card className="hover:shadow-xl transition-shadow" data-testid="card-plan-free">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">FREE</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground ml-2">/month</span>
                  </div>
                  <p className="text-muted-foreground">Perfect for trying out ListSnapper</p>
                </div>
                <Link href="/register">
                  <Button variant="secondary" className="w-full mb-6" data-testid="button-select-free">
                    Get Started
                  </Button>
                </Link>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm">5 QR codes maximum</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm">Basic features</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm">Email support</span>
                  </div>
                  <div className="flex items-start space-x-3 opacity-40">
                    <X className="h-5 w-5 mt-0.5" />
                    <span className="text-sm">No analytics</span>
                  </div>
                  <div className="flex items-start space-x-3 opacity-40">
                    <X className="h-5 w-5 mt-0.5" />
                    <span className="text-sm">No custom branding</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* STANDARD Plan */}
            <Card className="border-2 border-primary hover:shadow-xl transition-shadow relative" data-testid="card-plan-standard">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground rounded-full text-sm font-semibold">
                Popular
              </div>
              <CardContent className="p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">STANDARD</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-bold">$4.99</span>
                    <span className="text-muted-foreground ml-2">/month</span>
                  </div>
                  <p className="text-muted-foreground">For growing businesses</p>
                </div>
                <Link href="/checkout/standard">
                  <Button className="w-full mb-6" data-testid="button-select-standard">
                    Start Free Trial
                  </Button>
                </Link>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm">50 QR codes maximum</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm">Full analytics dashboard</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm">Custom QR design options</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm">Priority support</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm">Export analytics data</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PRO Plan */}
            <Card className="hover:shadow-xl transition-shadow" data-testid="card-plan-pro">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">PRO</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-bold">$9.99</span>
                    <span className="text-muted-foreground ml-2">/month</span>
                  </div>
                  <p className="text-muted-foreground">For power users & agencies</p>
                </div>
                <Link href="/checkout/pro">
                  <Button variant="secondary" className="w-full mb-6" data-testid="button-select-pro">
                    Start Free Trial
                  </Button>
                </Link>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm">Unlimited QR codes</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm">Advanced analytics</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm">API access</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm">White-label options</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm">Dedicated support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Comparison Table */}
          <div className="mt-20 max-w-6xl mx-auto">
            <h3 className="text-2xl font-bold mb-8 text-center">Feature Comparison</h3>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="table-feature-comparison">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">Feature</th>
                      <th className="px-6 py-4 text-center font-semibold">FREE</th>
                      <th className="px-6 py-4 text-center font-semibold">STANDARD</th>
                      <th className="px-6 py-4 text-center font-semibold">PRO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-6 py-4">QR Code Limit</td>
                      <td className="px-6 py-4 text-center">5</td>
                      <td className="px-6 py-4 text-center">50</td>
                      <td className="px-6 py-4 text-center">Unlimited</td>
                    </tr>
                    <tr className="bg-muted/20">
                      <td className="px-6 py-4">Analytics Dashboard</td>
                      <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">Custom Branding</td>
                      <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                    </tr>
                    <tr className="bg-muted/20">
                      <td className="px-6 py-4">API Access</td>
                      <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">White-label</td>
                      <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
