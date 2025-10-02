import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CloudUpload, QrCode } from "lucide-react";

export default function CreateQR() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    destinationUrl: "",
    customColor: "#000000",
    customBgColor: "#FFFFFF",
    logoUrl: "",
    isActive: true,
  });

  const [previewData, setPreviewData] = useState({
    shortCode: "AB12CD34", // Preview placeholder
    fullUrl: "listsnap.io/r/AB12CD34"
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/qr-codes', data);
      return response.json();
    },
    onSuccess: (qrCode) => {
      queryClient.invalidateQueries({ queryKey: ['/api/qr-codes'] });
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

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        
        <div className="min-h-screen py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <Link href="/dashboard">
                <Button variant="ghost" className="mb-4" data-testid="button-back-dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-3xl font-bold" data-testid="text-create-qr-title">Create New QR Code</h1>
              <p className="text-muted-foreground mt-2">Design and customize your QR code</p>
            </div>

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
                    <div>
                      <Label>Logo (Optional)</Label>
                      <div 
                        onClick={handleFileUpload}
                        className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                        data-testid="button-upload-logo"
                      >
                        <CloudUpload className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Settings */}
                <Card data-testid="card-advanced-settings">
                  <CardHeader>
                    <CardTitle>Advanced Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                      disabled={createMutation.isPending}
                      data-testid="button-create-qr-submit"
                    >
                      {createMutation.isPending ? "Creating..." : "Create QR Code"}
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
