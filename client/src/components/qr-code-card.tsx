import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Eye, Download, MoreVertical, Edit, Trash, BarChart3, Calendar } from "lucide-react";

interface QrCodeCardProps {
  qrCode: {
    id: string;
    name: string;
    shortCode: string;
    destinationUrl: string;
    isActive: boolean;
    scanCount: number;
    createdAt: string;
  };
}

export function QrCodeCard({ qrCode }: QrCodeCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/qr-codes/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/qr-codes'] });
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
            <p className="text-sm text-muted-foreground" data-testid="text-qr-shortcode">
              listsnap.io/r/{qrCode.shortCode}
            </p>
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
          <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
            <span className="text-xs text-muted-foreground">QR Preview</span>
          </div>
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

        <div className="flex items-center space-x-2">
          <Button variant="secondary" className="flex-1" data-testid="button-view-qr">
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleDownload}
            disabled={isDownloading}
            data-testid="button-download-qr"
          >
            <Download className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" data-testid="button-qr-menu">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => deleteMutation.mutate(qrCode.id)}
                className="text-destructive"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
