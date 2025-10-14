import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Eye, Download, Trash, BarChart3, Calendar, ExternalLink, Power } from "lucide-react";
import QRCode from "qrcode";

interface QrCodeCardProps {
  qrCode: {
    id: string;
    name: string;
    shortCode: string;
    destinationUrl: string;
    isActive: boolean;
    customColor?: string | null;
    customBgColor?: string | null;
    scanCount: number;
    createdAt: string;
  };
}

export function QrCodeCard({ qrCode }: QrCodeCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Generate QR code preview with custom colors
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const shortUrl = `${window.location.origin}/r/${qrCode.shortCode}`;
        const dataUrl = await QRCode.toDataURL(shortUrl, {
          width: 200,
          margin: 1,
          color: {
            dark: qrCode.customColor || '#000000',
            light: qrCode.customBgColor || '#FFFFFF'
          }
        });
        setQrCodeDataUrl(dataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };
    
    generateQRCode();
  }, [qrCode.shortCode, qrCode.customColor, qrCode.customBgColor]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/qr-codes/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/qr-codes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/plan-limits'] });
      toast({
        title: "Success",
        description: "QR code deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete QR code",
        variant: "destructive"
      });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest('PUT', `/api/qr-codes/${id}`, { isActive });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/qr-codes'] });
      toast({
        title: "Success",
        description: variables.isActive ? "QR code activated" : "QR code deactivated"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update QR code status",
        variant: "destructive"
      });
    }
  });

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await apiRequest('GET', `/api/qr-codes/${qrCode.id}/download`);
      const data = await response.json();
      
      // Create download link
      const link = document.createElement('a');
      link.href = data.dataUrl;
      link.download = `${qrCode.name.replace(/\s+/g, '_')}_QR.png`;
      link.click();
      
      toast({
        title: "Success",
        description: "QR code downloaded successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download QR code",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="hover:shadow-lg transition-shadow group" data-testid={`card-qr-${qrCode.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1" data-testid="text-qr-name">
              {qrCode.name}
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm text-muted-foreground cursor-help" data-testid="text-qr-shortcode">
                    listsnap.io/r/{qrCode.shortCode}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Short code: Unique 8-character identifier for this QR code</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={qrCode.isActive ? "default" : "secondary"}
              data-testid="badge-qr-status"
            >
              {qrCode.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        
        {/* QR Code Preview */}
        <div className="bg-white p-4 rounded-lg mb-4 flex items-center justify-center border">
          {qrCodeDataUrl ? (
            <img 
              src={qrCodeDataUrl} 
              alt={`QR Code for ${qrCode.name}`}
              className="w-32 h-32"
            />
          ) : (
            <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center space-x-1 text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            <span data-testid="text-qr-scans">{qrCode.scanCount || 0} scans</span>
          </div>
          <div className="flex items-center space-x-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span data-testid="text-qr-created">{formatDate(qrCode.createdAt)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link href={`/qr/${qrCode.id}`} className="col-span-2">
            <Button variant="default" className="w-full" data-testid="button-view-qr">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  data-testid="button-download-qr"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download QR Code</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Link href={`/analytics`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Analytics</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Link>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActiveMutation.mutate({ id: qrCode.id, isActive: !qrCode.isActive })}
                  data-testid="button-toggle-active"
                >
                  <Power className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{qrCode.isActive ? 'Deactivate' : 'Activate'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => deleteMutation.mutate(qrCode.id)}
                  className="text-destructive hover:bg-destructive/10"
                  data-testid="button-delete-qr"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete QR Code</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
