import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, QrCode, AlertTriangle } from "lucide-react";

export default function CreateQR() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: planLimits, isLoading: isPlanLimitsLoading } = useQuery<any>({
    queryKey: ['/api/plan-limits']
  });

  const [formData, setFormData] = useState({
    name: "",
    destinationUrl: "",
    customColor: "#000000",
    customBgColor: "#FFFFFF",
    customText: "",
    textPosition: "bottom" as "top" | "bottom",
    isActive: true,
  });

  const [previewData, setPreviewData] = useState({
    shortCode: "PREVIEW", // Preview placeholder
    fullUrl: `${window.location.origin}/r/PREVIEW`
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/qr-codes', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create QR code');
      }
      return response.json();
    },
    onSuccess: (qrCode) => {
      queryClient.invalidateQueries({ queryKey: ['/api/qr-codes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/plan-limits'] });
      toast({
        title: "Success",
        description: "QR code created successfully!"
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create QR code",
        variant: "destructive"
      });
    }
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.destinationUrl) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      new URL(formData.destinationUrl);
    } catch {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        
        <div className="min-h-screen py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <div className="sticky top-16 z-10 bg-muted/95 backdrop-blur-sm -mx-4 px-4 py-2 mb-4">
                <Link href="/dashboard">
                  <Button variant="ghost" data-testid="button-back-dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
              <h1 className="text-3xl font-bold" data-testid="text-create-qr-title">Create New QR Code</h1>
              <p className="text-muted-foreground mt-2">Design and customize your QR code</p>
            </div>

            {/* Plan Limit Warning */}
            {planLimits && !planLimits.canCreateMore && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>QR Code Limit Reached</AlertTitle>
                <AlertDescription>
                  You've reached your {planLimits.displayName} plan limit of {planLimits.maxQrCodes} QR codes.{' '}
                  <Link href="/pricing">
                    <span className="underline cursor-pointer font-semibold">Upgrade your plan</span>
                  </Link>{' '}
                  to create more QR codes, or delete some existing codes first.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Form Section */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card data-testid="card-basic-info">
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">QR Code Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Product Launch 2024"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        data-testid="input-qr-name"
                        maxLength={50}
                        className="max-w-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="url">Destination URL *</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://example.com"
                        value={formData.destinationUrl}
                        onChange={(e) => handleChange("destinationUrl", e.target.value)}
                        data-testid="input-destination-url"
                      />
                      <p className="text-sm text-muted-foreground mt-1">Where should this QR code redirect?</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Design Customization */}
                <Card data-testid="card-design-customization">
                  <CardHeader>
                    <CardTitle>Design Customization</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">💡 Tip: Use your brand colors for better recognition</p>
                    
                    {/* Color Presets */}
                    <div>
                      <Label className="mb-3 block">Color Presets</Label>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                          { name: 'Classic', fg: '#000000', bg: '#FFFFFF' },
                          { name: 'Reverse', fg: '#FFFFFF', bg: '#000000' },
                          { name: 'Ocean', fg: '#1E3A8A', bg: '#DBEAFE' },
                          { name: 'Forest', fg: '#14532D', bg: '#DCFCE7' },
                          { name: 'Sunset', fg: '#EA580C', bg: '#FEF3C7' },
                          { name: 'Royal', fg: '#6B21A8', bg: '#F3E8FF' },
                          { name: 'Cherry', fg: '#B91C1C', bg: '#FCE7F3' },
                          { name: 'Corporate', fg: '#374151', bg: '#F3F4F6' },
                          { name: 'Mint', fg: '#0F766E', bg: '#CCFBF1' },
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              handleChange("customColor", preset.fg);
                              handleChange("customBgColor", preset.bg);
                            }}
                            className="flex flex-col items-center p-2 rounded-lg border-2 border-border hover:border-primary transition-colors cursor-pointer"
                            title={preset.name}
                          >
                            <div className="w-full h-8 rounded flex items-center justify-center mb-1" style={{ backgroundColor: preset.bg }}>
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.fg }}></div>
                            </div>
                            <span className="text-xs text-muted-foreground">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="color">QR Code Color</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={formData.customColor}
                          onChange={(e) => handleChange("customColor", e.target.value)}
                          className="w-12 h-12 rounded-lg border border-input cursor-pointer"
                          data-testid="input-qr-color"
                        />
                        <Input
                          value={formData.customColor}
                          onChange={(e) => handleChange("customColor", e.target.value)}
                          className="flex-1 font-mono"
                          data-testid="input-qr-color-text"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="bgColor">Background Color</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={formData.customBgColor}
                          onChange={(e) => handleChange("customBgColor", e.target.value)}
                          className="w-12 h-12 rounded-lg border border-input cursor-pointer"
                          data-testid="input-bg-color"
                        />
                        <Input
                          value={formData.customBgColor}
                          onChange={(e) => handleChange("customBgColor", e.target.value)}
                          className="flex-1 font-mono"
                          data-testid="input-bg-color-text"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Settings */}
                <Card data-testid="card-advanced-settings">
                  <CardHeader>
                    <CardTitle>Advanced Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="customText">Custom Text (Optional)</Label>
                      <Input
                        id="customText"
                        placeholder="e.g., Scan to view listing"
                        value={formData.customText}
                        onChange={(e) => handleChange("customText", e.target.value)}
                        maxLength={50}
                        data-testid="input-custom-text"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Text will appear on your QR code image (max 50 characters)</p>
                      
                      {formData.customText && (
                        <div className="mt-3">
                          <Label className="text-xs">Text Position</Label>
                          <div className="flex gap-2 mt-2">
                            <Button
                              type="button"
                              variant={formData.textPosition === "top" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleChange("textPosition", "top")}
                              className="flex-1"
                            >
                              Top
                            </Button>
                            <Button
                              type="button"
                              variant={formData.textPosition === "bottom" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleChange("textPosition", "bottom")}
                              className="flex-1"
                            >
                              Bottom
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="active"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => handleChange("isActive", checked as boolean)}
                        data-testid="checkbox-active"
                      />
                      <div>
                        <Label htmlFor="active" className="font-medium">Active by default</Label>
                        <p className="text-sm text-muted-foreground">QR code will be immediately active</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preview Section */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24" data-testid="card-qr-preview">
                  <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white p-8 rounded-lg flex items-center justify-center mb-4">
                      <div 
                        className="w-48 h-48 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/30"
                        style={{ 
                          backgroundColor: formData.customBgColor,
                          color: formData.customColor 
                        }}
                        data-testid="div-qr-preview"
                      >
                        <QrCode className="h-32 w-32" />
                      </div>
                    </div>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Short Code:</span>
                        <span className="font-mono" data-testid="text-preview-shortcode">{previewData.shortCode}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Full URL:</span>
                        <span className="font-mono text-xs truncate ml-2" data-testid="text-preview-url">{previewData.fullUrl}</span>
                      </div>
                    </div>
                    <Button 
                      onClick={handleSubmit}
                      className="w-full"
                      disabled={createMutation.isPending || !planLimits?.canCreateMore}
                      data-testid="button-create-qr-submit"
                    >
                      {createMutation.isPending ? "Creating..." : 
                       !planLimits?.canCreateMore ? "Plan Limit Reached" : "Create QR Code"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
