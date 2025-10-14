import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { OrderDialog } from "@/components/order-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  MapPin, 
  Monitor, 
  Calendar,
  ExternalLink,
  QrCode as QrCodeIcon,
  Package,
  FileText,
  Lock,
  Zap,
  Edit,
  History,
  Clock,
  Palette,
  Copy,
  Check
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import type { QrCode, QrCodeUrlHistory } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Analytics {
  totalScans: number;
  uniqueVisitors: number;
  deviceBreakdown: Record<string, number>;
  locationBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
}

export default function QrDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [qrDataUrl, setQrDataUrl] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newDestinationUrl, setNewDestinationUrl] = useState("");
  const [editColorsDialogOpen, setEditColorsDialogOpen] = useState(false);
  const [newQrColor, setNewQrColor] = useState("");
  const [newBgColor, setNewBgColor] = useState("");
  const [copiedShortCode, setCopiedShortCode] = useState(false);
  const [copiedFullUrl, setCopiedFullUrl] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  const hasAnalyticsAccess = user?.membership?.tierName === 'STANDARD' || user?.membership?.tierName === 'PRO';

  const { data: qrCode, isLoading } = useQuery<QrCode>({
    queryKey: [`/api/qr-codes/${id}`],
    enabled: !!id
  });

  const { data: analytics } = useQuery<Analytics>({
    queryKey: [`/api/qr-codes/${id}/analytics`],
    enabled: !!id && hasAnalyticsAccess
  });

  const { data: urlHistory = [] } = useQuery<QrCodeUrlHistory[]>({
    queryKey: [`/api/qr-codes/${id}/url-history`],
    enabled: !!id
  });

  const updateUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      return await apiRequest('PUT', `/api/qr-codes/${id}`, { destinationUrl: url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/qr-codes/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/qr-codes/${id}/url-history`] });
      toast({
        title: "Success",
        description: "Destination URL updated successfully",
      });
      setEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update destination URL",
        variant: "destructive",
      });
    },
  });

  const updateColorsMutation = useMutation({
    mutationFn: async ({ qrColor, bgColor }: { qrColor: string; bgColor: string }) => {
      return await apiRequest('PUT', `/api/qr-codes/${id}`, { 
        customColor: qrColor,
        customBgColor: bgColor 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/qr-codes/${id}`] });
      toast({
        title: "Success",
        description: "QR code colors updated successfully",
      });
      setEditColorsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update QR code colors",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (qrCode) {
      const fullUrl = `${window.location.origin}/r/${qrCode.shortCode}`;
      QRCode.toDataURL(fullUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: qrCode.customColor ?? "#000000",
          light: qrCode.customBgColor ?? "#FFFFFF"
        }
      }).then(setQrDataUrl);
    }
  }, [qrCode]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-muted/30">
          <Navigation />
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!qrCode) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-muted/30">
          <Navigation />
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">QR Code Not Found</h2>
              <p className="text-muted-foreground mb-4">The requested QR code could not be found.</p>
              <Button onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const fullUrl = `${window.location.origin}/r/${qrCode.shortCode}`;

  const handleDownload = async (format: string) => {
    const link = document.createElement('a');
    link.download = `qr-${qrCode.shortCode}.${format}`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleEditUrl = () => {
    setNewDestinationUrl(qrCode?.destinationUrl || "");
    setEditDialogOpen(true);
  };

  const handleUpdateUrl = () => {
    if (!newDestinationUrl || !newDestinationUrl.startsWith('http')) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }
    updateUrlMutation.mutate(newDestinationUrl);
  };

  const handleEditColors = () => {
    setNewQrColor(qrCode?.customColor || "#000000");
    setNewBgColor(qrCode?.customBgColor || "#FFFFFF");
    setEditColorsDialogOpen(true);
  };

  const handleUpdateColors = () => {
    updateColorsMutation.mutate({ 
      qrColor: newQrColor, 
      bgColor: newBgColor 
    });
  };

  const handleCopyShortCode = async () => {
    await navigator.clipboard.writeText(qrCode?.shortCode || "");
    setCopiedShortCode(true);
    setTimeout(() => setCopiedShortCode(false), 2000);
  };

  const handleCopyFullUrl = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopiedFullUrl(true);
    setTimeout(() => setCopiedFullUrl(false), 2000);
  };

  const topLocations = analytics?.locationBreakdown ? 
    Object.entries(analytics.locationBreakdown)
      .map(([country, count]: [string, any]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3) : [];

  const topDevices = analytics?.deviceBreakdown ?
    Object.entries(analytics.deviceBreakdown)
      .map(([device, count]: [string, any]) => ({ device, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3) : [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="sticky top-16 z-10 bg-muted/95 backdrop-blur-sm -mx-4 px-4 py-2 mb-4">
              <Link href="/dashboard">
                <Button variant="ghost" data-testid="button-back-dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - QR Code */}
            <div className="lg:col-span-1 space-y-6">
              <Card data-testid="card-qr-preview">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <QrCodeIcon className="h-5 w-5 mr-2" />
                      QR Code
                    </CardTitle>
                    <Badge variant={qrCode.isActive ? "default" : "secondary"} data-testid="badge-status">
                      {qrCode.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {qrDataUrl && (
                    <div className="bg-white p-6 rounded-lg flex items-center justify-center">
                      <img 
                        src={qrDataUrl} 
                        alt="QR Code" 
                        className="w-full max-w-[300px] h-auto"
                        data-testid="img-qr-code"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Short Code</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 group cursor-pointer">
                              <p className="font-mono font-semibold" data-testid="text-short-code">
                                {qrCode.shortCode}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={handleCopyShortCode}
                                data-testid="button-copy-short-code"
                              >
                                {copiedShortCode ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>This code will be printed at the bottom right of your QR code. Click to copy.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Full URL</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 group">
                              <a 
                                href={fullUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center text-sm break-all"
                                data-testid="link-full-url"
                              >
                                {fullUrl}
                                <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                              </a>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                onClick={handleCopyFullUrl}
                                data-testid="button-copy-full-url"
                              >
                                {copiedFullUrl ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>This is the URL where users will be redirected when they scan your QR code. Click icon to copy.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleDownload('png')}
                      data-testid="button-download-qr"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Code
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Order Buttons */}
              <Card data-testid="card-order-products">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Order Physical Products
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full" 
                    variant="default"
                    onClick={() => setOrderDialogOpen(true)}
                    data-testid="button-order-stickers"
                  >
                    Order Stickers
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Details & Analytics */}
            <div className="lg:col-span-2 space-y-6">
              {/* QR Code Details */}
              <Card data-testid="card-qr-details">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Name</span>
                    <p className="font-semibold" data-testid="text-qr-name">{qrCode.name}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Destination URL</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleEditUrl}
                        data-testid="button-edit-url"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <a 
                      href={qrCode.destinationUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center break-all"
                      data-testid="link-destination-url"
                    >
                      {qrCode.destinationUrl}
                      <ExternalLink className="h-4 w-4 ml-1 flex-shrink-0" />
                    </a>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">QR Code Colors</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleEditColors}
                        data-testid="button-edit-colors"
                      >
                        <Palette className="h-4 w-4 mr-1" />
                        Edit Colors
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground">QR Color</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <div 
                            className="w-8 h-8 rounded border" 
                            style={{ backgroundColor: qrCode.customColor ?? undefined }}
                            data-testid="div-qr-color"
                          ></div>
                          <span className="font-mono text-sm">{qrCode.customColor}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Background Color</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <div 
                            className="w-8 h-8 rounded border" 
                            style={{ backgroundColor: qrCode.customBgColor ?? undefined }}
                            data-testid="div-bg-color"
                          ></div>
                          <span className="font-mono text-sm">{qrCode.customBgColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(qrCode.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Analytics Overview or Upgrade Prompt */}
              {!hasAnalyticsAccess ? (
                <Card data-testid="card-upgrade-prompt" className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/10">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lock className="h-5 w-5 mr-2 text-primary" />
                      Unlock Analytics
                    </CardTitle>
                    <CardDescription>
                      Upgrade to STANDARD or PRO to access detailed analytics for your QR codes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold">Real-Time Insights</div>
                          <div className="text-sm text-muted-foreground">Track scans, unique visitors, and engagement</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold">Location Analytics</div>
                          <div className="text-sm text-muted-foreground">See where your QR codes are being scanned</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Monitor className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold">Device & Browser Breakdown</div>
                          <div className="text-sm text-muted-foreground">Understand your audience better</div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        className="flex-1" 
                        onClick={() => setLocation('/checkout/STANDARD')}
                        data-testid="button-upgrade-standard"
                      >
                        Upgrade to STANDARD
                        <span className="ml-2 text-xs">$4.99/mo</span>
                      </Button>
                      <Button 
                        className="flex-1" 
                        variant="outline"
                        onClick={() => setLocation('/checkout/PRO')}
                        data-testid="button-upgrade-pro"
                      >
                        Upgrade to PRO
                        <span className="ml-2 text-xs">$9.99/mo</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card data-testid="card-analytics-overview">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Eye className="h-5 w-5 mr-2" />
                        Analytics Overview
                      </CardTitle>
                      <Link href="/analytics">
                        <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700 border-green-600 hover:border-green-700 hover:bg-green-50 dark:hover:bg-green-950" data-testid="button-view-full-analytics">
                          View Full Analytics
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <div className="text-3xl font-bold" data-testid="text-total-scans">
                          {analytics?.totalScans || qrCode.scanCount || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Scans</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold" data-testid="text-unique-visitors">
                          {analytics?.uniqueVisitors || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Unique Visitors</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold" data-testid="text-conversion-rate">
                          {analytics && analytics.totalScans > 0 ? 
                            Math.round((analytics.uniqueVisitors / analytics.totalScans) * 100) : 0}%
                        </div>
                        <div className="text-sm text-muted-foreground">Unique Rate</div>
                      </div>
                    </div>

                    {topLocations.length > 0 && (
                      <>
                        <Separator className="my-4" />
                        <div className="space-y-3">
                          <div className="flex items-center text-sm font-semibold">
                            <MapPin className="h-4 w-4 mr-2" />
                            Top Locations
                          </div>
                          {topLocations.map(({ country, count }) => (
                            <div key={country} className="flex justify-between text-sm">
                              <span>{country}</span>
                              <span className="font-semibold">{count} scans</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {topDevices.length > 0 && (
                      <>
                        <Separator className="my-4" />
                        <div className="space-y-3">
                          <div className="flex items-center text-sm font-semibold">
                            <Monitor className="h-4 w-4 mr-2" />
                            Top Devices
                          </div>
                          {topDevices.map(({ device, count }) => (
                            <div key={device} className="flex justify-between text-sm capitalize">
                              <span>{device}</span>
                              <span className="font-semibold">{count} scans</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* URL History Card */}
              {urlHistory.length > 0 && (
                <Card data-testid="card-url-history">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <History className="h-5 w-5 mr-2" />
                      URL History
                    </CardTitle>
                    <CardDescription>
                      Previous destination URLs for this QR code
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {urlHistory.map((entry) => (
                        <div 
                          key={entry.id} 
                          className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
                          data-testid={`history-entry-${entry.id}`}
                        >
                          <div className="flex-1 min-w-0">
                            <a 
                              href={entry.destinationUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline break-all block"
                            >
                              {entry.destinationUrl}
                            </a>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(entry.changedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Edit URL Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent data-testid="dialog-edit-url">
            <DialogHeader>
              <DialogTitle>Edit Destination URL</DialogTitle>
              <DialogDescription>
                Update where this QR code redirects to. The previous URL will be saved in history.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="destination-url">Destination URL</Label>
                <Input
                  id="destination-url"
                  value={newDestinationUrl}
                  onChange={(e) => setNewDestinationUrl(e.target.value)}
                  placeholder="https://example.com"
                  data-testid="input-new-url"
                />
                <p className="text-xs text-muted-foreground">
                  Must start with http:// or https://
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateUrl}
                disabled={updateUrlMutation.isPending}
                data-testid="button-save-url"
              >
                {updateUrlMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Colors Dialog */}
        <Dialog open={editColorsDialogOpen} onOpenChange={setEditColorsDialogOpen}>
          <DialogContent data-testid="dialog-edit-colors">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Edit QR Code Colors
              </DialogTitle>
              <DialogDescription>
                Customize the colors of your QR code. The QR code will update automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label htmlFor="qr-color">QR Code Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="qr-color"
                    value={newQrColor}
                    onChange={(e) => setNewQrColor(e.target.value)}
                    className="h-12 w-20 rounded border cursor-pointer"
                    data-testid="input-qr-color"
                  />
                  <Input
                    value={newQrColor}
                    onChange={(e) => setNewQrColor(e.target.value)}
                    placeholder="#000000"
                    className="font-mono"
                    data-testid="input-qr-color-hex"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  The main color of the QR code pattern
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="bg-color">Background Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="bg-color"
                    value={newBgColor}
                    onChange={(e) => setNewBgColor(e.target.value)}
                    className="h-12 w-20 rounded border cursor-pointer"
                    data-testid="input-bg-color"
                  />
                  <Input
                    value={newBgColor}
                    onChange={(e) => setNewBgColor(e.target.value)}
                    placeholder="#FFFFFF"
                    className="font-mono"
                    data-testid="input-bg-color-hex"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  The background color behind the QR code
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-16 h-16 rounded border-2"
                    style={{ 
                      backgroundColor: newBgColor,
                      borderColor: newQrColor 
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <div 
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: newQrColor }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p className="font-mono">{newQrColor}</p>
                    <p className="font-mono">{newBgColor}</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditColorsDialogOpen(false)}
                data-testid="button-cancel-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateColors}
                disabled={updateColorsMutation.isPending}
                data-testid="button-save-colors"
              >
                {updateColorsMutation.isPending ? "Saving..." : "Save Colors"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Order Dialog Modal */}
        <OrderDialog
          open={orderDialogOpen}
          onOpenChange={setOrderDialogOpen}
          qrCodeId={id || null}
          initialProductType="sticker"
        />
      </div>
    </ProtectedRoute>
  );
}
