import { useState } from "react";
import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, Search, HelpCircle } from "lucide-react";

const faqData = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I create my first QR code?",
        a: "Click 'Create QR Code' from your dashboard, enter a name and destination URL, customize the colors if desired, and click 'Create'. Your QR code will be instantly generated and ready to use!"
      },
      {
        q: "What is a short code?",
        a: "A short code is a unique 8-character identifier for your QR code (e.g., AB12CD34). It's used in the shortened URL: listsnap.io/r/AB12CD34"
      },
      {
        q: "How do I download my QR code?",
        a: "Go to your dashboard, find the QR code you want, click the download button. You can also download from the QR code detail page."
      }
    ]
  },
  {
    category: "QR Code Management",
    questions: [
      {
        q: "Can I change where my QR code redirects?",
        a: "Yes! QR codes are dynamic. Go to the QR code detail page, click 'Edit' next to the destination URL, and update it. The QR code image stays the same but now redirects to the new location."
      },
      {
        q: "How do I deactivate a QR code without deleting it?",
        a: "Click the three-dot menu on any QR code card and select 'Deactivate'. This preserves all your analytics while stopping the QR code from working. You can reactivate it anytime."
      },
      {
        q: "Can I customize QR code colors?",
        a: "Absolutely! When creating or editing a QR code, use the color pickers or choose from our 9 preset color palettes. We recommend using your brand colors for better recognition."
      },
      {
        q: "What happens to my analytics if I delete a QR code?",
        a: "All analytics data is permanently deleted. If you want to preserve analytics, use the 'Deactivate' feature instead of deleting."
      }
    ]
  },
  {
    category: "Orders & Stickers",
    questions: [
      {
        q: "What sticker sizes are available?",
        a: "We offer three sizes: Small (1\" × 1\") for $0.50, Medium (2\" × 2\") for $1.00, and Large (3\" × 3\") for $1.50 per sticker."
      },
      {
        q: "Do I get free stickers with my subscription?",
        a: "Yes! Standard plan includes 25 free sticker credits per month, and Pro plan includes 100 free credits per month. Credits reset monthly."
      },
      {
        q: "How do sticker credits work?",
        a: "Each credit equals one sticker. When ordering, credits are automatically applied. If you have enough credits, payment is skipped entirely!"
      },
      {
        q: "Where can stickers be shipped?",
        a: "We ship high-quality vinyl stickers to USA, Canada, and UK. Stickers are weather-resistant, waterproof, and UV-resistant."
      }
    ]
  },
  {
    category: "Billing & Subscriptions",
    questions: [
      {
        q: "How many QR codes can I create on each plan?",
        a: "Free: 5 QR codes, Standard: 50 QR codes, Pro: Unlimited QR codes."
      },
      {
        q: "Can I upgrade from Standard to Pro?",
        a: "Yes! Go to Settings → Subscription, and click 'Upgrade to PRO'. Your existing subscription will be pro-rated automatically."
      },
      {
        q: "Can I cancel my subscription anytime?",
        a: "Absolutely. Go to Settings → Subscription → Cancel Subscription. You'll keep access until the end of your billing period."
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit and debit cards (Visa, Mastercard, American Express) through Stripe's secure payment processing."
      }
    ]
  },
  {
    category: "Analytics",
    questions: [
      {
        q: "What analytics are available on the Free plan?",
        a: "Free plan shows basic scan counts. Upgrade to Standard or Pro for detailed analytics including location data, operating systems, peak hours, and time series data."
      },
      {
        q: "How accurate is the location data?",
        a: "Location data is based on IP geolocation and shows country-level accuracy. For privacy reasons, we don't track exact addresses."
      },
      {
        q: "Can I export my analytics data?",
        a: "Standard and Pro users can export analytics data from the Analytics page using the Export button."
      }
    ]
  }
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter FAQs based on search
  const filteredFAQs = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(item =>
      searchQuery === "" ||
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        
        <div className="bg-background border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-2 mb-4">
              <Link href="/dashboard">
                <Button variant="ghost" data-testid="button-back-dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <HelpCircle className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold mb-2">Help & FAQ</h1>
              <p className="text-muted-foreground text-lg">
                Find answers to common questions about ListSnapper
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search for answers..."
                className="pl-10 h-12 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-faq"
              />
            </div>
          </div>

          {/* FAQ Categories */}
          {filteredFAQs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                <p className="text-muted-foreground">
                  Try different keywords or browse all categories
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSearchQuery("")}
                >
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {filteredFAQs.map((category, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle>{category.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((item, qIdx) => (
                        <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                          <AccordionTrigger className="text-left">
                            {item.q}
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-muted-foreground leading-relaxed">
                              {item.a}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Contact Support */}
          <Card className="mt-12 bg-primary/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">Still need help?</h3>
              <p className="text-muted-foreground mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <Button variant="default">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

