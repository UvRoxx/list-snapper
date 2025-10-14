import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { OrderDialog } from "@/components/order-dialog";
import { 
  Tag, 
  Package, 
  Check,
  Truck,
  Clock
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Orders() {
  const { user } = useAuth();
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedQrCodeId, setSelectedQrCodeId] = useState<string | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<string | null>(null);
  
  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ['/api/orders'],
    enabled: !!user
  });

  // Handle orders opened from QR detail page via URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qrId = params.get('qrId');
    const type = params.get('type');
    
    if (qrId) {
      setSelectedQrCodeId(qrId);
      setSelectedProductType(type || 'sticker');
      setOrderDialogOpen(true);
    }
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Check className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'processing':
        return <Clock className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-chart-4/10 text-chart-4';
      case 'shipped':
        return 'bg-chart-1/10 text-chart-1';
      case 'processing':
        return 'bg-chart-3/10 text-chart-3';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        
        <div className="bg-background border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="text-orders-title">Order History</h1>
            <p className="text-muted-foreground">View and track your sticker orders</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Order History */}
          <Card data-testid="card-order-history">
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                  <p className="text-muted-foreground">
                    Order your first physical QR code product to see your order history here
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="table-order-history">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Order ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Product</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Total</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orders.map((order: any) => (
                        <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Tag className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  Stickers
                                  {order.size && ` (${order.size})`}
                                  {order.quantity && ` x ${order.quantity}`}
                                </div>
                                <div className="text-sm text-muted-foreground">QR Code Product</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`${getStatusColor(order.status)} capitalize`}>
                              <span className="flex items-center space-x-1">
                                {getStatusIcon(order.status)}
                                <span>{order.status || 'pending'}</span>
                              </span>
                            </Badge>
                          </td>
                          <td className="px-6 py-4 font-semibold">${order.total}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" data-testid={`button-view-order-${order.id}`}>
                                Track Order
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <OrderDialog
        open={orderDialogOpen}
        onOpenChange={(open) => {
          setOrderDialogOpen(open);
          if (!open) {
            // Clean up URL params and reset state when dialog closes
            window.history.replaceState({}, '', '/orders');
            setSelectedProductType(null);
            setSelectedQrCodeId(null);
          }
        }}
        qrCodeId={selectedQrCodeId}
        initialProductType={selectedProductType}
      />
    </ProtectedRoute>
  );
}
