import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCodeCard } from "@/components/qr-code-card";
import { useAuth } from "@/hooks/use-auth";
import { 
  QrCode, 
  Plus, 
  Search, 
  BarChart3, 
  CheckCircle, 
  Crown, 
  Grid, 
  List 
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: qrCodes = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/qr-codes'],
    enabled: !!user
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      
      {/* Dashboard Header */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-dashboard-title">My QR Codes</h1>
              <p className="text-muted-foreground">Manage and track your QR codes</p>
            </div>
            <Link href="/create">
              <Button className="mt-4 md:mt-0" data-testid="button-create-qr">
                <Plus className="h-4 w-4 mr-2" />
                Create QR Code
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="stat-total-codes">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Total QR Codes</span>
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold">{qrCodes.length}</div>
              <div className="text-sm text-muted-foreground mt-1">
                <span className="text-primary">Active</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-total-scans">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Total Scans</span>
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold">
                {qrCodes.reduce((acc: number, qr: any) => acc + (qr.scanCount || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                <span className="text-primary">+12%</span> vs last month
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-active-codes">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Active Codes</span>
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold">
                {qrCodes.filter((qr: any) => qr.isActive).length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {qrCodes.length > 0 ? Math.round((qrCodes.filter((qr: any) => qr.isActive).length / qrCodes.length) * 100) : 0}% of total
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-plan-limit">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Plan Limit</span>
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold">{qrCodes.length}/5</div>
              <div className="text-sm text-muted-foreground mt-1">Free Plan</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    placeholder="Search QR codes..." 
                    className="pl-10"
                    data-testid="input-search-qr"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Select defaultValue="all">
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="date">
                  <SelectTrigger data-testid="select-sort-filter">
                    <SelectValue placeholder="Sort by Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Sort by Date</SelectItem>
                    <SelectItem value="scans">Sort by Scans</SelectItem>
                    <SelectItem value="name">Sort by Name</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex border border-border rounded-lg">
                  <Button variant="ghost" size="sm" data-testid="button-grid-view">
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" data-testid="button-list-view">
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Codes Grid */}
        {qrCodes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No QR Codes Yet</h3>
              <p className="text-muted-foreground mb-6">
                Get started by creating your first QR code
              </p>
              <Link href="/create">
                <Button data-testid="button-create-first-qr">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First QR Code
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-qr-codes">
            {qrCodes.map((qrCode: any) => (
              <QrCodeCard key={qrCode.id} qrCode={qrCode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
