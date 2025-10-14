import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  QrCode, 
  ShoppingCart, 
  DollarSign, 
  Trash2, 
  TrendingUp, 
  Activity,
  Package,
  Eye,
  Search,
  Download,
  MoreVertical,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Navigation } from "@/components/navigation";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  isAdmin: boolean;
  membershipTier: string;
  createdAt: string;
};

type QrCodeItem = {
  id: string;
  name: string;
  shortCode: string;
  userEmail: string;
  isActive: boolean;
  scanCount: number;
  createdAt: string;
};

type OrderItem = {
  id: string;
  userEmail: string;
  qrCodeName: string;
  productType: string;
  quantity: number;
  total: string;
  status: string;
  createdAt: string;
};

type PlatformStats = {
  totalUsers: number;
  totalQrCodes: number;
  totalScans: number;
  totalOrders: number;
  revenueThisMonth: number;
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [orderToUpdate, setOrderToUpdate] = useState<{ id: string; status: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (user && !user.isAdmin) {
      toast({
        title: "Access Denied",
        description: "You do not have admin privileges to access this page.",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [user, setLocation, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: qrCodes = [], isLoading: qrCodesLoading } = useQuery<QrCodeItem[]>({
    queryKey: ['/api/admin/qr-codes'],
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<OrderItem[]>({
    queryKey: ['/api/admin/orders'],
  });

  // Computed metrics
  const activeUsers = useMemo(() => 
    users.filter(u => u.membershipTier !== 'FREE').length, 
    [users]
  );

  const activeQrCodes = useMemo(() => 
    qrCodes.filter(qr => qr.isActive).length, 
    [qrCodes]
  );

  const pendingOrders = useMemo(() => 
    orders.filter(o => o.status === 'pending' || o.status === 'processing').length, 
    [orders]
  );

  const topQrCodes = useMemo(() => 
    [...qrCodes]
      .sort((a, b) => b.scanCount - a.scanCount)
      .slice(0, 5),
    [qrCodes]
  );

  const recentOrders = useMemo(() => 
    [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
    [orders]
  );

  // Filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.company || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = 
        statusFilter === "all" ||
        (statusFilter === "admin" && user.isAdmin) ||
        (statusFilter === "paid" && user.membershipTier !== "FREE") ||
        (statusFilter === "free" && user.membershipTier === "FREE");

      return matchesSearch && matchesFilter;
    });
  }, [users, searchTerm, statusFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.qrCodeName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = 
        statusFilter === "all" ||
        order.status === statusFilter;

      return matchesSearch && matchesFilter;
    });
  }, [orders, searchTerm, statusFilter]);

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest(`/api/admin/users/${userId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "User deleted",
        description: "User has been successfully deleted.",
      });
      setDeleteUserId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      await apiRequest(`/api/admin/orders/${orderId}`, 'PATCH', { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({
        title: "Order updated",
        description: "Order status has been updated successfully.",
      });
      setOrderToUpdate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      processing: "bg-blue-500",
      shipped: "bg-purple-500",
      delivered: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-muted-foreground">Loading admin dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" data-testid="text-admin-title">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive platform management and analytics
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-total-users">
                {stats?.totalUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <span className="text-primary font-medium">{activeUsers}</span> with paid plans
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
              <QrCode className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-total-qrcodes">
                {stats?.totalQrCodes || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <span className="text-blue-500 font-medium">{activeQrCodes}</span> currently active
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
              <Eye className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-total-scans">
                {stats?.totalScans?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Across all QR codes
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-monthly-revenue">
                ${stats?.revenueThisMonth?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This month's revenue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {pendingOrders} pending
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Scans per QR</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalQrCodes && stats?.totalScans 
                  ? Math.round(stats.totalScans / stats.totalQrCodes)
                  : 0
                }
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Per QR code
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalUsers && activeUsers
                  ? `${Math.round((activeUsers / stats.totalUsers) * 100)}%`
                  : '0%'
                }
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Free to paid conversion
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Insights */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Top Performing QR Codes
              </CardTitle>
              <CardDescription>QR codes with the most scans</CardDescription>
            </CardHeader>
            <CardContent>
              {topQrCodes.length > 0 ? (
                <div className="space-y-3">
                  {topQrCodes.map((qr, index) => (
                    <div key={qr.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{qr.name}</p>
                          <p className="text-xs text-muted-foreground">{qr.userEmail}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-mono">
                        {qr.scanCount.toLocaleString()} scans
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No QR codes yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                Recent Orders
              </CardTitle>
              <CardDescription>Latest order activity</CardDescription>
            </CardHeader>
            <CardContent>
              {recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{order.userEmail}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.quantity}x Sticker
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(order.status)} variant="default">
                          {order.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          ${order.total}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No orders yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Tables */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 h-auto">
            <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
              <UserCheck className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="qrcodes" className="gap-2" data-testid="tab-qrcodes">
              <QrCode className="h-4 w-4" />
              QR Codes
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2" data-testid="tab-orders">
              <ShoppingCart className="h-4 w-4" />
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage all platform users and their memberships</CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {filteredUsers.length} users
                  </Badge>
                </div>
                <div className="flex gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                      <SelectItem value="paid">Paid Plans</SelectItem>
                      <SelectItem value="free">Free Tier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No users found</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Membership</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium" data-testid={`text-email-${user.id}`}>
                                  {user.email}
                                </p>
                                <p className="text-sm text-muted-foreground" data-testid={`text-name-${user.id}`}>
                                  {user.firstName} {user.lastName}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell data-testid={`text-company-${user.id}`}>
                              {user.company || <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={user.membershipTier === 'PRO' ? 'default' : user.membershipTier === 'STANDARD' ? 'secondary' : 'outline'}
                                data-testid={`badge-tier-${user.id}`}
                              >
                                {user.membershipTier || 'FREE'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.isAdmin && (
                                <Badge variant="default" className="bg-primary" data-testid={`badge-admin-${user.id}`}>
                                  Admin
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell data-testid={`text-joined-${user.id}`}>
                              {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => setDeleteUserId(user.id)}
                                    disabled={user.isAdmin}
                                    className="text-destructive"
                                    data-testid={`button-delete-user-${user.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qrcodes" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>QR Code Management</CardTitle>
                    <CardDescription>View and manage all QR codes across the platform</CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {qrCodes.length} total
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {qrCodesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading QR codes...</div>
                ) : qrCodes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No QR codes found</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>QR Code</TableHead>
                          <TableHead>Short Code</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Scans</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {qrCodes.map((qr) => (
                          <TableRow key={qr.id} data-testid={`row-qrcode-${qr.id}`}>
                            <TableCell>
                              <p className="font-medium" data-testid={`text-qrname-${qr.id}`}>
                                {qr.name}
                              </p>
                            </TableCell>
                            <TableCell data-testid={`text-shortcode-${qr.id}`}>
                              <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                                {qr.shortCode}
                              </code>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm" data-testid={`text-owner-${qr.id}`}>
                                {qr.userEmail}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={qr.isActive ? "default" : "secondary"}
                                data-testid={`badge-status-${qr.id}`}
                                className={qr.isActive ? "bg-green-500" : ""}
                              >
                                {qr.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium" data-testid={`text-scans-${qr.id}`}>
                                  {qr.scanCount.toLocaleString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell data-testid={`text-created-${qr.id}`}>
                              {format(new Date(qr.createdAt), 'MMM dd, yyyy')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            {/* Fulfillment Export Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">📦 Manual Fulfillment</h3>
                    <p className="text-sm text-muted-foreground">
                      Export pending orders for manual printing ({pendingOrders} orders ready)
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      const pending = orders.filter(o => o.status === 'pending' || o.status === 'processing');
                      const csv = [
                        ['Order ID', 'Customer Email', 'QR Code Name', 'Product', 'Quantity', 'Size', 'Shipping Address', 'Date'].join(','),
                        ...pending.map(o => [
                          `"${o.id.slice(0, 8)}"`,
                          `"${o.userEmail}"`,
                          `"${o.qrCodeName}"`,
                          '"Sticker"',
                          o.quantity,
                          `"${(o as any).size || 'N/A'}"`,
                          `"${(o as any).shippingAddress || 'N/A'}"`,
                          `"${new Date(o.createdAt).toLocaleDateString()}"`
                        ].join(','))
                      ].join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `fulfillment-list-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    📄 Export Fulfillment List (CSV)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Order Management</CardTitle>
                    <CardDescription>Manage and track all platform orders</CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {filteredOrders.length} orders
                  </Badge>
                </div>
                <div className="flex gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No orders found</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order Details</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => (
                          <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium" data-testid={`text-customer-${order.id}`}>
                                  {order.userEmail}
                                </p>
                                <p className="text-sm text-muted-foreground" data-testid={`text-qrcode-${order.id}`}>
                                  QR: {order.qrCodeName}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell data-testid={`text-product-${order.id}`}>
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {order.quantity}x Sticker
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold" data-testid={`text-total-${order.id}`}>
                                ${order.total}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={getStatusColor(order.status)} 
                                variant="default"
                                data-testid={`badge-order-status-${order.id}`}
                              >
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`text-date-${order.id}`}>
                              {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setOrderToUpdate({ id: order.id, status: order.status })}
                                data-testid={`button-update-order-${order.id}`}
                              >
                                Update
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete User Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              This will permanently delete the user and all their associated data including QR codes and orders.
              <strong className="block mt-2">This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && deleteUserMutation.mutate(deleteUserId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Order Dialog */}
      <AlertDialog open={!!orderToUpdate} onOpenChange={() => setOrderToUpdate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Order Status</AlertDialogTitle>
            <AlertDialogDescription>
              Select the new status for this order
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select
              value={orderToUpdate?.status || 'pending'}
              onValueChange={(value) => 
                setOrderToUpdate(prev => prev ? { ...prev, status: value } : null)
              }
            >
              <SelectTrigger data-testid="select-order-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-update">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (orderToUpdate) {
                  updateOrderMutation.mutate({
                    orderId: orderToUpdate.id,
                    status: orderToUpdate.status
                  });
                }
              }}
              data-testid="button-confirm-update"
            >
              Update Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}