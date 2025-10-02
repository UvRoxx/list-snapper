import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Tag, 
  Package, 
  Check,
  Truck,
  Clock
} from "lucide-react";

export default function Orders() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: orders = [] } = useQuery({
    queryKey: ['/api/orders'],
    enabled: !!user
  });

  const handleOrderStickers = () => {
    toast({
      title: "Order Stickers",
      description: "Sticker ordering with Printify integration will be implemented here"
    });
  };

  const handleOrderYardSigns = () => {
    toast({
      title: "Order Yard Signs", 
      description: "Yard sign ordering with Printify integration will be implemented here"
    });
  };

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
            <h1 className="text-3xl font-bold mb-2" data-testid="text-orders-title">Order Physical Products</h1>
            <p className="text-muted-foreground">Get your QR codes printed on stickers or yard signs</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Product Selection */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Stickers Product */}
            <Card className="hover:shadow-lg transition-shadow" data-testid="card-sticker-product">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 p-8 flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                  alt="QR code stickers in different sizes" 
                  className="w-full h-full object-cover rounded-lg"
                  data-testid="img-stickers"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-2">QR Code Stickers</h3>
                <p className="text-muted-foreground mb-4">Weather-resistant, high-quality vinyl stickers</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Waterproof & UV resistant</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>3 sizes available (1", 2", 3")</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Bulk discounts available</span>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <div className="text-sm text-muted-foreground mb-2">Starting from</div>
                  <div className="text-3xl font-bold">$0.50 <span className="text-lg font-normal text-muted-foreground">/ sticker</span></div>
                </div>

                <Button 
                  onClick={handleOrderStickers}
                  className="w-full"
                  data-testid="button-order-stickers"
                >
                  Order Stickers
                </Button>
              </CardContent>
            </Card>

            {/* Yard Signs Product */}
            <Card className="hover:shadow-lg transition-shadow" data-testid="card-yard-sign-product">
              <div className="aspect-video bg-gradient-to-br from-accent/20 to-primary/20 p-8 flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                  alt="QR code yard sign in outdoor setting" 
                  className="w-full h-full object-cover rounded-lg"
                  data-testid="img-yard-signs"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-2">QR Code Yard Signs</h3>
                <p className="text-muted-foreground mb-4">Durable 18"x24" signs with wire stakes</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Weather-resistant corrugated plastic</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Includes H-wire stake</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Double-sided printing available</span>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <div className="text-sm text-muted-foreground mb-2">Starting from</div>
                  <div className="text-3xl font-bold">$12.99 <span className="text-lg font-normal text-muted-foreground">/ sign</span></div>
                </div>

                <Button 
                  onClick={handleOrderYardSigns}
                  className="w-full"
                  data-testid="button-order-yard-signs"
                >
                  Order Yard Signs
                </Button>
              </CardContent>
            </Card>
          </div>

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
                                  {order.productType === 'sticker' ? 'Stickers' : 'Yard Sign'}
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
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
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
    </ProtectedRoute>
  );
}
