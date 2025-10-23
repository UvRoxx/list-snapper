import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Navigation />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Terms Content */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>1. Agreement to Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                By accessing and using SnapList ("Service"), you agree to be bound by these Terms of Service.
                If you do not agree to these terms, please do not use our Service.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>2. Description of Service</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                SnapList provides QR code generation, management, and custom sticker printing services.
                Our Service allows users to create dynamic QR codes, track analytics, and order physical
                stickers with their custom QR codes.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>3. User Accounts</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p className="mb-3">
                To use certain features of our Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>4. Subscription and Payment</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p className="mb-3">
                Our Service offers both free and paid subscription plans:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Subscription fees are billed in advance on a recurring basis</li>
                <li>Payments are processed securely through Stripe</li>
                <li>You may cancel your subscription at any time</li>
                <li>Refunds are handled on a case-by-case basis</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>5. Orders and Shipping</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p className="mb-3">
                For physical sticker orders:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Orders are processed within 3-5 business days</li>
                <li>Shipping times vary by location (CA, US, UK)</li>
                <li>Tracking information will be provided when available</li>
                <li>Damaged or incorrect orders should be reported within 7 days</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>6. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                The Service and its original content, features, and functionality are owned by SnapList
                and are protected by international copyright, trademark, and other intellectual property laws.
                You retain all rights to content you upload to our Service.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>7. Acceptable Use</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p className="mb-3">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Distribute malicious code or spam</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Create QR codes linking to illegal or harmful content</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>8. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                To the maximum extent permitted by law, SnapList shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages resulting from your use of or
                inability to use the Service.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>9. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                We reserve the right to modify these terms at any time. We will notify users of any
                material changes via email or through the Service. Your continued use of the Service
                after such modifications constitutes acceptance of the updated terms.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>10. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="mt-3">
                Email: support@snaplist.com<br />
                Address: [To be provided by client]
              </p>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground mt-8">
            <p>
              By using SnapList, you acknowledge that you have read, understood, and agree to be bound
              by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
