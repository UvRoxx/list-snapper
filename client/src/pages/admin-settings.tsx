import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  DollarSign,
  Mail,
  Palette,
  ArrowLeft,
  Save,
  Calculator
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Navigation } from "@/components/navigation";
import { useState } from "react";

type AdminSetting = {
  id: string;
  key: string;
  value: string;
  description: string | null;
  category: string;
  updatedAt: string;
};

type SettingsGroup = {
  [key: string]: string;
};

export default function AdminSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not admin
  if (user && !user.isAdmin) {
    setLocation("/dashboard");
    return null;
  }

  // Fetch all settings
  const { data: settings = [], isLoading } = useQuery<AdminSetting[]>({
    queryKey: ["/api/admin/settings"],
  });

  // Group settings by category
  const settingsByCategory = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = {};
    }
    acc[setting.category][setting.key] = setting.value;
    return acc;
  }, {} as Record<string, SettingsGroup>);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: { key: string; value: string; category: string }[]) => {
      return apiRequest("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ settings: updates }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveCategory = (category: string, formData: Record<string, string>) => {
    const updates = Object.entries(formData).map(([key, value]) => ({
      key,
      value,
      category,
    }));
    updateSettingsMutation.mutate(updates);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLocation("/admin")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Admin Settings
            </h1>
            <p className="text-muted-foreground">Configure platform settings and preferences</p>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading settings...</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="email" className="space-y-6">
            <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4 h-auto">
              <TabsTrigger value="email" className="gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="shipping" className="gap-2">
                <Calculator className="h-4 w-4" />
                Shipping
              </TabsTrigger>
              <TabsTrigger value="qr" className="gap-2">
                <Palette className="h-4 w-4" />
                QR Codes
              </TabsTrigger>
              <TabsTrigger value="stripe" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Stripe
              </TabsTrigger>
            </TabsList>

            {/* Email Settings */}
            <TabsContent value="email">
              <EmailSettings
                settings={settingsByCategory.email || {}}
                onSave={(data) => handleSaveCategory("email", data)}
                isLoading={updateSettingsMutation.isPending}
              />
            </TabsContent>

            {/* Shipping Settings */}
            <TabsContent value="shipping">
              <ShippingSettings
                settings={settingsByCategory.shipping || {}}
                onSave={(data) => handleSaveCategory("shipping", data)}
                isLoading={updateSettingsMutation.isPending}
              />
            </TabsContent>

            {/* QR Code Settings */}
            <TabsContent value="qr">
              <QRCodeSettings
                settings={settingsByCategory.qr || {}}
                onSave={(data) => handleSaveCategory("qr", data)}
                isLoading={updateSettingsMutation.isPending}
              />
            </TabsContent>

            {/* Stripe Settings */}
            <TabsContent value="stripe">
              <StripeSettings
                settings={settingsByCategory.stripe || {}}
                onSave={(data) => handleSaveCategory("stripe", data)}
                isLoading={updateSettingsMutation.isPending}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

// Email Settings Component
function EmailSettings({
  settings,
  onSave,
  isLoading
}: {
  settings: SettingsGroup;
  onSave: (data: Record<string, string>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    email_from: settings.email_from || "",
    email_reply_to: settings.email_reply_to || "",
    aws_region: settings.aws_region || "ca-central-1",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Configuration</CardTitle>
        <CardDescription>
          Configure AWS SES email settings for automated notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email_from">From Email Address</Label>
          <Input
            id="email_from"
            type="email"
            placeholder="noreply@yourdomain.com"
            value={formData.email_from}
            onChange={(e) => setFormData({ ...formData, email_from: e.target.value })}
          />
          <p className="text-sm text-muted-foreground">
            The email address that automated emails will be sent from
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email_reply_to">Reply-To Email Address</Label>
          <Input
            id="email_reply_to"
            type="email"
            placeholder="support@yourdomain.com"
            value={formData.email_reply_to}
            onChange={(e) => setFormData({ ...formData, email_reply_to: e.target.value })}
          />
          <p className="text-sm text-muted-foreground">
            Catch-all email for customer replies
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aws_region">AWS Region</Label>
          <Input
            id="aws_region"
            placeholder="ca-central-1"
            value={formData.aws_region}
            onChange={(e) => setFormData({ ...formData, aws_region: e.target.value })}
          />
          <p className="text-sm text-muted-foreground">
            AWS region for SES (e.g., ca-central-1 for Toronto)
          </p>
        </div>

        <Button
          onClick={() => onSave(formData)}
          disabled={isLoading}
          className="w-full md:w-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Email Settings
        </Button>
      </CardContent>
    </Card>
  );
}

// Shipping Settings Component
function ShippingSettings({
  settings,
  onSave,
  isLoading
}: {
  settings: SettingsGroup;
  onSave: (data: Record<string, string>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    shipping_base_cost_ca: settings.shipping_base_cost_ca || "5.00",
    shipping_base_cost_us: settings.shipping_base_cost_us || "8.00",
    shipping_base_cost_uk: settings.shipping_base_cost_uk || "10.00",
    shipping_per_item_ca: settings.shipping_per_item_ca || "0.50",
    shipping_per_item_us: settings.shipping_per_item_us || "0.75",
    shipping_per_item_uk: settings.shipping_per_item_uk || "1.00",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping & Pricing Calculator</CardTitle>
        <CardDescription>
          Configure shipping costs for different markets (CA, US, UK)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Canada</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shipping_base_cost_ca">Base Shipping Cost</Label>
              <Input
                id="shipping_base_cost_ca"
                type="number"
                step="0.01"
                placeholder="5.00"
                value={formData.shipping_base_cost_ca}
                onChange={(e) => setFormData({ ...formData, shipping_base_cost_ca: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping_per_item_ca">Per Item Cost</Label>
              <Input
                id="shipping_per_item_ca"
                type="number"
                step="0.01"
                placeholder="0.50"
                value={formData.shipping_per_item_ca}
                onChange={(e) => setFormData({ ...formData, shipping_per_item_ca: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">United States</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shipping_base_cost_us">Base Shipping Cost</Label>
              <Input
                id="shipping_base_cost_us"
                type="number"
                step="0.01"
                placeholder="8.00"
                value={formData.shipping_base_cost_us}
                onChange={(e) => setFormData({ ...formData, shipping_base_cost_us: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping_per_item_us">Per Item Cost</Label>
              <Input
                id="shipping_per_item_us"
                type="number"
                step="0.01"
                placeholder="0.75"
                value={formData.shipping_per_item_us}
                onChange={(e) => setFormData({ ...formData, shipping_per_item_us: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">United Kingdom</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shipping_base_cost_uk">Base Shipping Cost</Label>
              <Input
                id="shipping_base_cost_uk"
                type="number"
                step="0.01"
                placeholder="10.00"
                value={formData.shipping_base_cost_uk}
                onChange={(e) => setFormData({ ...formData, shipping_base_cost_uk: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping_per_item_uk">Per Item Cost</Label>
              <Input
                id="shipping_per_item_uk"
                type="number"
                step="0.01"
                placeholder="1.00"
                value={formData.shipping_per_item_uk}
                onChange={(e) => setFormData({ ...formData, shipping_per_item_uk: e.target.value })}
              />
            </div>
          </div>
        </div>

        <Button
          onClick={() => onSave(formData)}
          disabled={isLoading}
          className="w-full md:w-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Shipping Settings
        </Button>
      </CardContent>
    </Card>
  );
}

// QR Code Settings Component
function QRCodeSettings({
  settings,
  onSave,
  isLoading
}: {
  settings: SettingsGroup;
  onSave: (data: Record<string, string>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    qr_style: settings.qr_style || "rounded",
    qr_dot_style: settings.qr_dot_style || "rounded",
    qr_corner_style: settings.qr_corner_style || "rounded",
    qr_default_color: settings.qr_default_color || "#000000",
    qr_default_bg: settings.qr_default_bg || "#FFFFFF",
    qr_style_json: settings.qr_style_json || "",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code Styling</CardTitle>
        <CardDescription>
          Standardize QR code appearance across all generated codes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="qr_dot_style">Dot Style</Label>
          <Input
            id="qr_dot_style"
            placeholder="rounded"
            value={formData.qr_dot_style}
            onChange={(e) => setFormData({ ...formData, qr_dot_style: e.target.value })}
          />
          <p className="text-sm text-muted-foreground">
            Options: rounded, dots, classy, square
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="qr_corner_style">Corner Style</Label>
          <Input
            id="qr_corner_style"
            placeholder="rounded"
            value={formData.qr_corner_style}
            onChange={(e) => setFormData({ ...formData, qr_corner_style: e.target.value })}
          />
          <p className="text-sm text-muted-foreground">
            Options: rounded, square, extra-rounded
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="qr_default_color">Default QR Color</Label>
            <Input
              id="qr_default_color"
              type="color"
              value={formData.qr_default_color}
              onChange={(e) => setFormData({ ...formData, qr_default_color: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qr_default_bg">Default Background</Label>
            <Input
              id="qr_default_bg"
              type="color"
              value={formData.qr_default_bg}
              onChange={(e) => setFormData({ ...formData, qr_default_bg: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="qr_style_json">QR Style JSON (from qr-code-styling)</Label>
          <Textarea
            id="qr_style_json"
            placeholder='{"dotsOptions": {"type": "rounded"}, "cornersSquareOptions": {"type": "rounded"}}'
            value={formData.qr_style_json}
            onChange={(e) => setFormData({ ...formData, qr_style_json: e.target.value })}
            rows={6}
          />
          <p className="text-sm text-muted-foreground">
            Paste JSON export from qr-code-styling website
          </p>
        </div>

        <Button
          onClick={() => onSave(formData)}
          disabled={isLoading}
          className="w-full md:w-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          Save QR Settings
        </Button>
      </CardContent>
    </Card>
  );
}

// Stripe Settings Component
function StripeSettings({
  settings,
  onSave,
  isLoading
}: {
  settings: SettingsGroup;
  onSave: (data: Record<string, string>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    stripe_price_standard_cad: settings.stripe_price_standard_cad || "",
    stripe_price_standard_usd: settings.stripe_price_standard_usd || "",
    stripe_price_standard_gbp: settings.stripe_price_standard_gbp || "",
    stripe_price_pro_cad: settings.stripe_price_pro_cad || "",
    stripe_price_pro_usd: settings.stripe_price_pro_usd || "",
    stripe_price_pro_gbp: settings.stripe_price_pro_gbp || "",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stripe Multi-Currency Configuration</CardTitle>
        <CardDescription>
          Configure Stripe price IDs for different currencies (CAD, USD, GBP)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Standard Plan</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stripe_price_standard_cad">CAD Price ID</Label>
              <Input
                id="stripe_price_standard_cad"
                placeholder="price_xxx"
                value={formData.stripe_price_standard_cad}
                onChange={(e) => setFormData({ ...formData, stripe_price_standard_cad: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe_price_standard_usd">USD Price ID</Label>
              <Input
                id="stripe_price_standard_usd"
                placeholder="price_xxx"
                value={formData.stripe_price_standard_usd}
                onChange={(e) => setFormData({ ...formData, stripe_price_standard_usd: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe_price_standard_gbp">GBP Price ID</Label>
              <Input
                id="stripe_price_standard_gbp"
                placeholder="price_xxx"
                value={formData.stripe_price_standard_gbp}
                onChange={(e) => setFormData({ ...formData, stripe_price_standard_gbp: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Pro Plan</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stripe_price_pro_cad">CAD Price ID</Label>
              <Input
                id="stripe_price_pro_cad"
                placeholder="price_xxx"
                value={formData.stripe_price_pro_cad}
                onChange={(e) => setFormData({ ...formData, stripe_price_pro_cad: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe_price_pro_usd">USD Price ID</Label>
              <Input
                id="stripe_price_pro_usd"
                placeholder="price_xxx"
                value={formData.stripe_price_pro_usd}
                onChange={(e) => setFormData({ ...formData, stripe_price_pro_usd: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe_price_pro_gbp">GBP Price ID</Label>
              <Input
                id="stripe_price_pro_gbp"
                placeholder="price_xxx"
                value={formData.stripe_price_pro_gbp}
                onChange={(e) => setFormData({ ...formData, stripe_price_pro_gbp: e.target.value })}
              />
            </div>
          </div>
        </div>

        <Button
          onClick={() => onSave(formData)}
          disabled={isLoading}
          className="w-full md:w-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Stripe Settings
        </Button>
      </CardContent>
    </Card>
  );
}
